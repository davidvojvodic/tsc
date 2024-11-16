import { LucideIcon } from "lucide-react";

interface HeadingProps {
  title: string;
  description: string;
  icon?: LucideIcon;
}

export const Heading: React.FC<HeadingProps> = ({
  title,
  description,
  icon: Icon,
}) => {
  return (
    <div className="flex items-center gap-4">
      {Icon && (
        <div className="p-2 w-fit rounded-md bg-primary/10">
          <Icon className="w-8 h-8 text-primary" />
        </div>
      )}
      <div>
        <h2 className="text-3xl font-bold tracking-tight">{title}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
};
