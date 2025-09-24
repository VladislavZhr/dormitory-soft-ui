"use client";

import { Button } from "@heroui/react"; // для старту ОК (глобальна інсталяція)

export default function Page() {
  return (
    <main className="p-6">
      <Button color="primary" className="mt-4">
        HeroUI OK
      </Button>
    </main>
  );
}
