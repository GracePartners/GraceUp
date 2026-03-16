"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import Link from "next/link";

type Workspace = {
  id: string;
  name: string;
};

export default function WorkspacesPage() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);

  useEffect(() => {
    async function loadWorkspaces() {
      const token = localStorage.getItem("token");

      const res = await api.get("/workspaces", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      setWorkspaces(res.data);
    }

    loadWorkspaces();
  }, []);

  return (
    <div style={{ padding: 40 }}>
      <h1>Workspaces</h1>

      <ul>
        {workspaces.map((workspace) => (
          <li key={workspace.id}>
          <Link href={`/workspace/${workspace.id}`}>
            {workspace.name}
          </Link>
        </li>
        ))}
      </ul>
    </div>
  );
}