export interface Teacher {
  id: string;
  name: string;
  bio: string | null;
  photoId: string | null;
  photo: {
    url: string;
  } | null;
  createdAt: string;
}
