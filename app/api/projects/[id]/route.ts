/* eslint-disable @typescript-eslint/no-explicit-any */
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { MediaType } from "@prisma/client";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// Schema Definitions
const heroImageSchema = z
  .object({
    url: z.string().url(),
    ufsUrl: z.string().url().optional(),
    fileKey: z.string(),
    size: z.number().optional(), // Optional in the schema validation but will default
    mimeType: z.string().optional(), // Optional in the schema validation but will default
  })
  .nullable();

const mediaSchema = z.union([
  z.array(
    z.object({
      id: z.string(),
      url: z.string(),
      ufsUrl: z.string().optional(),
      fileKey: z.string().optional(),
      alt: z.string().nullable(),
      size: z.number().optional(), // Optional in the schema validation but will default to 0
      mimeType: z.string().optional(), // Optional in the schema validation but will default
    })
  ),
  z.object({
    url: z.string(),
    ufsUrl: z.string().optional(),
    fileKey: z.string().optional(),
    size: z.number().optional(),
    mimeType: z.string().optional(),
  }),
  z.null(),
]);

const timelinePhaseSchema = z.object({
  id: z.string(),
  title: z.string(),
  title_sl: z.string().nullable(),
  title_hr: z.string().nullable(),
  description: z.string(),
  description_sl: z.string().nullable(),
  description_hr: z.string().nullable(),
  startDate: z.preprocess((arg) => {
    if (typeof arg === "string" || arg instanceof Date) return new Date(arg);
    return null;
  }, z.date().nullable()),
  endDate: z.preprocess((arg) => {
    if (typeof arg === "string" || arg instanceof Date) return new Date(arg);
    return null;
  }, z.date().nullable()),
  completed: z.boolean(),
  order: z.number(),
  media: mediaSchema,
});

const galleryImageSchema = z.object({
  id: z.string(),
  url: z.string(),
  ufsUrl: z.string().optional(),
  fileKey: z.string(),
  alt: z.string().nullable(),
  size: z.number().optional(), // Optional in the schema validation but will default
  mimeType: z.string().optional(), // Optional in the schema validation but will default
});

const projectSchema = z.object({
  basicInfo: z.object({
    name: z.string().min(1, "Name is required"),
    name_sl: z.string().nullable(),
    name_hr: z.string().nullable(),
    slug: z.string().min(1, "Slug is required"),
    description: z.string().nullable(),
    description_sl: z.string().nullable(),
    description_hr: z.string().nullable(),
    published: z.boolean(),
    featured: z.boolean(),
    heroImage: heroImageSchema,
  }),
  timeline: z.array(timelinePhaseSchema),
  gallery: z.array(galleryImageSchema),
  teacherIds: z.array(z.string()),
});

// Helper Functions
async function checkAdminAccess(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  return user?.role === "ADMIN";
}

// Helper function to create a media record

// PATCH Route Handler
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth.api.getSession({
      headers: headers(),
    });

    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const isAdmin = await checkAdminAccess(session.user.id);
    if (!isAdmin) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const body = await req.json();
    const validatedData = projectSchema.parse(body);

    // Check if slug is unique
    const existingProject = await prisma.project.findFirst({
      where: {
        slug: validatedData.basicInfo.slug,
        NOT: { id: params.id },
      },
    });

    if (existingProject) {
      return new NextResponse("Slug already exists", { status: 400 });
    }

    // Update project and all related data
    const project = await prisma.$transaction(async (tx) => {
      // Handle hero image
      let heroImageUpdate = {};
      if (validatedData.basicInfo.heroImage !== undefined) {
        const currentProject = await tx.project.findUnique({
          where: { id: params.id },
          select: { heroImage: true },
        });

        if (currentProject?.heroImage) {
          await tx.media.delete({
            where: { id: currentProject.heroImage.id },
          });
        }

        if (validatedData.basicInfo.heroImage) {
          const newHeroImage = await tx.media.create({
            data: {
              filename: validatedData.basicInfo.heroImage.fileKey,
              url:
                validatedData.basicInfo.heroImage.ufsUrl ||
                validatedData.basicInfo.heroImage.url,
              type: MediaType.IMAGE,
              mimeType:
                validatedData.basicInfo.heroImage.mimeType || "image/jpeg",
              size: validatedData.basicInfo.heroImage.size || 0,
            },
          });
          heroImageUpdate = { heroImageId: newHeroImage.id };
        } else {
          heroImageUpdate = { heroImage: { disconnect: true } };
        }
      }

      // Update gallery
      await tx.media.deleteMany({
        where: {
          id: {
            in:
              (
                await tx.project.findUnique({
                  where: { id: params.id },
                  select: { gallery: { select: { id: true } } },
                })
              )?.gallery.map((img) => img.id) || [],
          },
        },
      });

      const newGalleryImages = await Promise.all(
        validatedData.gallery.map((img) =>
          tx.media.create({
            data: {
              filename: img.fileKey,
              url: img.ufsUrl || img.url,
              type: MediaType.IMAGE,
              mimeType: img.mimeType || "image/jpeg",
              size: img.size || 0,
              alt: img.alt,
            },
          })
        )
      );

      // Retrieve current phases with media and gallery for comparison
      const currentPhases = await tx.projectPhase.findMany({
        where: { projectId: params.id },
        include: { 
          media: true,
          gallery: true,
        },
      });
      
      // Create a map of existing media to avoid duplicates
      const existingMediaMap = new Map();
      
      // Track media IDs we should retain
      const mediaIdsToKeep = new Set();
      
      // Fill the existing media map with all current media
      for (const phase of currentPhases) {
        // Primary media
        if (phase.media) {
          existingMediaMap.set(phase.media.url, phase.media);
        }
        
        // Gallery media
        if (phase.gallery && phase.gallery.length > 0) {
          phase.gallery.forEach(img => {
            existingMediaMap.set(img.url, img);
          });
        }
      }
      
      // First, delete old phases but keep track of which media to preserve
      await tx.projectPhase.deleteMany({ where: { projectId: params.id } });
      
      // Create new timeline phases with media
      await Promise.all(
        validatedData.timeline.map(async (phase) => {
          let mediaId: string | undefined;
          let additionalGalleryImages: any[] = [];

          // Process phase media (multiple images using new schema)
          if (phase.media && Array.isArray(phase.media) && phase.media.length > 0) {
            console.log(`Processing phase with ${phase.media.length} media items`);
            
            const phaseMediaItems = [];
            
            // Process all media items for this phase
            for(let i = 0; i < phase.media.length; i++) {
              const img = phase.media[i];
              let media;
              
              // Check if this media already exists by URL
              const existingMedia = existingMediaMap.get(img.url || img.ufsUrl);
              
              if (existingMedia) {
                // Use existing media
                media = existingMedia;
                mediaIdsToKeep.add(existingMedia.id);
                console.log(`Reusing existing media: ${existingMedia.id}`);
              } else {
                // Create new media only if it doesn't exist
                console.log(`Creating new media for: ${img.url || img.ufsUrl}`);
                media = await tx.media.create({
                  data: {
                    filename: img.fileKey || img.id || "unknown",
                    url: img.ufsUrl || img.url,
                    type: MediaType.IMAGE,
                    mimeType: img.mimeType || "image/jpeg",
                    size: img.size || 0,
                    alt: img.alt || null,
                  },
                });
              }
              
              // Add to list of all phase media
              phaseMediaItems.push(media);
              
              // Set the first one as primary media
              if (i === 0) {
                mediaId = media.id;
              }
            }
            
            // We'll connect all images to the phase gallery when we create the phase
            if (phaseMediaItems.length > 1) {
              // Get all except the primary one (which will be connected via mediaId)
              additionalGalleryImages = phaseMediaItems.slice(1);
            }
          }

          // Create the phase with primary media and gallery relations
          return tx.projectPhase.create({
            data: {
              title: phase.title,
              title_sl: phase.title_sl,
              title_hr: phase.title_hr,
              description: phase.description,
              description_sl: phase.description_sl,
              description_hr: phase.description_hr,
              startDate: phase.startDate,
              endDate: phase.endDate,
              completed: phase.completed,
              order: phase.order,
              projectId: params.id,
              ...(mediaId ? { mediaId } : {}),
              // Connect additional images to the phase gallery
              ...(additionalGalleryImages.length > 0 ? {
                gallery: {
                  connect: additionalGalleryImages.map(media => ({ id: media.id }))
                }
              } : {})
            },
          });
        })
      );

      // Clean up unused media (those not in mediaIdsToKeep)
      // This is done after creating phases to avoid foreign key constraints
      const existingMediaIds = Array.from(existingMediaMap.values()).map(media => media.id);
      const mediaToDelete = existingMediaIds.filter(id => !mediaIdsToKeep.has(id));
      
      if (mediaToDelete.length > 0) {
        console.log(`Cleaning up ${mediaToDelete.length} unused media items`);
        // Delete unused media that's not being reused
        await tx.media.deleteMany({
          where: {
            id: {
              in: mediaToDelete
            }
          }
        });
      }
      
      // Update the project with all new data
      return await tx.project.update({
        where: { id: params.id },
        data: {
          name: validatedData.basicInfo.name,
          name_sl: validatedData.basicInfo.name_sl,
          name_hr: validatedData.basicInfo.name_hr,
          slug: validatedData.basicInfo.slug,
          description: validatedData.basicInfo.description,
          description_sl: validatedData.basicInfo.description_sl,
          description_hr: validatedData.basicInfo.description_hr,
          published: validatedData.basicInfo.published,
          featured: validatedData.basicInfo.featured,
          ...heroImageUpdate,
          gallery: {
            connect: newGalleryImages.map((img) => ({ id: img.id })),
          },
          teachers: {
            set: validatedData.teacherIds.map((id) => ({ id })),
          },
        },
        include: {
          heroImage: true,
          gallery: true,
          teachers: {
            include: {
              photo: true,
            },
          },
          timeline: {
            include: {
              media: true,
              gallery: true,
            },
            orderBy: {
              order: "asc",
            },
          },
        },
      });
    });

    return NextResponse.json(project);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(error.issues, { status: 422 });
    }
    console.error("[PROJECT_PATCH]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

// POST Route Handler
export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: headers(),
    });

    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const isAdmin = await checkAdminAccess(session.user.id);
    if (!isAdmin) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const body = await req.json();
    const validatedData = projectSchema.parse(body);

    // Check if slug is unique
    const existingProject = await prisma.project.findUnique({
      where: { slug: validatedData.basicInfo.slug },
    });

    if (existingProject) {
      return new NextResponse("Slug already exists", { status: 400 });
    }

    // Create project with all related data
    const project = await prisma.$transaction(async (tx) => {
      // Create hero image if provided
      let heroImageId: string | undefined;
      if (validatedData.basicInfo.heroImage) {
        const media = await tx.media.create({
          data: {
            filename: validatedData.basicInfo.heroImage.fileKey,
            url:
              validatedData.basicInfo.heroImage.ufsUrl ||
              validatedData.basicInfo.heroImage.url,
            type: MediaType.IMAGE,
            mimeType:
              validatedData.basicInfo.heroImage.mimeType || "image/jpeg",
            size: validatedData.basicInfo.heroImage.size || 0,
          },
        });
        heroImageId = media.id;
      }

      // Create gallery images
      const galleryImages = await Promise.all(
        validatedData.gallery.map((img) =>
          tx.media.create({
            data: {
              filename: img.fileKey,
              url: img.ufsUrl || img.url,
              type: MediaType.IMAGE,
              mimeType: img.mimeType || "image/jpeg",
              size: img.size || 0,
              alt: img.alt,
            },
          })
        )
      );

      // Create the project
      const newProject = await tx.project.create({
        data: {
          name: validatedData.basicInfo.name,
          name_sl: validatedData.basicInfo.name_sl,
          name_hr: validatedData.basicInfo.name_hr,
          slug: validatedData.basicInfo.slug,
          description: validatedData.basicInfo.description,
          description_sl: validatedData.basicInfo.description_sl,
          description_hr: validatedData.basicInfo.description_hr,
          published: validatedData.basicInfo.published,
          featured: validatedData.basicInfo.featured,
          ...(heroImageId && { heroImageId }),
          gallery: {
            connect: galleryImages.map((img) => ({ id: img.id })),
          },
          teachers: {
            connect: validatedData.teacherIds.map((id) => ({ id })),
          },
        },
      });

      // Create timeline phases with media
      await Promise.all(
        validatedData.timeline.map(async (phase) => {
          let mediaId: string | undefined;
          let additionalGalleryImages: any[] = [];

          // Process phase media (multiple images using new schema)
          if (phase.media && Array.isArray(phase.media) && phase.media.length > 0) {
            console.log(`Processing phase with ${phase.media.length} media items`);
            
            const phaseMediaItems = [];
            
            // Create all media items for this phase
            for(let i = 0; i < phase.media.length; i++) {
              const img = phase.media[i];
              try {
                const media = await tx.media.create({
                  data: {
                    filename: img.fileKey || img.id || "unknown",
                    url: img.ufsUrl || img.url,
                    type: MediaType.IMAGE,
                    mimeType: img.mimeType || "image/jpeg",
                    size: img.size || 0,
                    alt: img.alt || null,
                  },
                });
                
                // Add to list of all phase media
                phaseMediaItems.push(media);
                
                // Set the first one as primary media
                if (i === 0) {
                  mediaId = media.id;
                }
              } catch (error) {
                console.error("Error creating phase media:", error);
              }
            }
            
            // We'll connect all images to the phase gallery when we create the phase
            if (phaseMediaItems.length > 1) {
              // Get all except the primary one (which will be connected via mediaId)
              additionalGalleryImages = phaseMediaItems.slice(1);
            }
          }

          // Create the phase with primary media and gallery relations
          return tx.projectPhase.create({
            data: {
              title: phase.title,
              title_sl: phase.title_sl || null,
              title_hr: phase.title_hr || null,
              description: phase.description,
              description_sl: phase.description_sl || null,
              description_hr: phase.description_hr || null,
              startDate: phase.startDate,
              endDate: phase.endDate,
              completed: phase.completed,
              order: phase.order,
              projectId: newProject.id,
              ...(mediaId ? { mediaId } : {}),
              // Connect additional images to the phase gallery
              ...(additionalGalleryImages.length > 0 ? {
                gallery: {
                  connect: additionalGalleryImages.map(media => ({ id: media.id }))
                }
              } : {})
            },
          });
        })
      );

      return await tx.project.findUnique({
        where: { id: newProject.id },
        include: {
          heroImage: true,
          gallery: true,
          teachers: {
            include: {
              photo: true,
            },
          },
          timeline: {
            include: {
              media: true,
              gallery: true,
            },
            orderBy: {
              order: "asc",
            },
          },
        },
      });
    });

    return NextResponse.json(project);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(error.issues, { status: 422 });
    }
    console.error("[PROJECTS_POST]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

// DELETE Route Handler
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth.api.getSession({
      headers: headers(),
    });

    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const isAdmin = await checkAdminAccess(session.user.id);
    if (!isAdmin) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const projectId = params.id;
    console.log("Deleting project with ID:", projectId);

    // First, get the project with all its relations to make sure it exists
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { 
        id: true,
        heroImageId: true,
        gallery: {
          select: { id: true }
        },
        timeline: {
          select: { 
            id: true,
            mediaId: true,
            gallery: {
              select: { id: true }
            }
          }
        }
      },
    });

    if (!project) {
      console.log("Project not found:", projectId);
      return new NextResponse("Project not found", { status: 404 });
    }

    // Create a simple transaction to handle all deletions in a safe order
    await prisma.$transaction(async (tx) => {
      console.log("Starting project deletion transaction");
      
      // 1. First, collect all media IDs to delete after other operations
      const mediaIds: string[] = [];
      
      // Add hero image if exists
      if (project.heroImageId) {
        console.log("Found hero image to delete:", project.heroImageId);
        mediaIds.push(project.heroImageId);
      }
      
      // Add gallery images
      if (project.gallery && project.gallery.length > 0) {
        console.log(`Found ${project.gallery.length} gallery images to delete`);
        project.gallery.forEach(img => mediaIds.push(img.id));
      }
      
      // Add phase media (both primary and gallery)
      if (project.timeline && project.timeline.length > 0) {
        // Add primary media IDs
        const primaryMediaIds = project.timeline
          .filter(phase => phase.mediaId !== null && phase.mediaId !== undefined)
          .map(phase => phase.mediaId as string);
        
        if (primaryMediaIds.length > 0) {
          console.log(`Found ${primaryMediaIds.length} primary phase media items to delete`);
          mediaIds.push(...primaryMediaIds);
        }
        
        // Add gallery image IDs
        const galleryMediaIds: string[] = [];
        project.timeline.forEach(phase => {
          if (phase.gallery && phase.gallery.length > 0) {
            phase.gallery.forEach(img => {
              if (img.id) galleryMediaIds.push(img.id);
            });
          }
        });
        
        if (galleryMediaIds.length > 0) {
          console.log(`Found ${galleryMediaIds.length} phase gallery media items to delete`);
          mediaIds.push(...galleryMediaIds);
        }
      }
      
      // 2. Delete project phases 
      console.log("Deleting project phases");
      await tx.projectPhase.deleteMany({
        where: { projectId }
      });
      
      // 3. Delete the project itself (this handles disconnecting relations)
      console.log("Deleting the project");
      await tx.project.delete({
        where: { id: projectId }
      });
      
      // 4. Now safely delete all media items
      if (mediaIds.length > 0) {
        console.log(`Deleting ${mediaIds.length} media items`);
        await tx.media.deleteMany({
          where: {
            id: { in: mediaIds }
          }
        });
      }
      
      console.log("Project deletion transaction completed successfully");
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[PROJECT_DELETE]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}