import { getAllChilds } from "../../lib/routes-config";
import { Link } from '@inertiajs/react';

export default function Outlet({ path }: { path: string }) {
  if (!path) throw new Error("path not provided");
  const output = getAllChilds(path);

  return (
    <div className="grid md:grid-cols-2 gap-5">
      {output.map((child: any) => (
        <ChildCard {...child} key={child.title} />
      ))}
    </div>
  );
}

type ChildCardProps = { title: string; href: string; description?: string };

function ChildCard({ description, href, title }: ChildCardProps) {
  return (
    <Link href={href} className="border rounded-md p-4 no-underline flex flex-col gap-0.5">
      <h4 className="!my-0">{title}</h4>
      <p className="text-sm text-muted-foreground !my-0">{description}</p>
    </Link>
  );
}
