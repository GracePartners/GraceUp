type HierarchyPageProps = {
  params: {
    workspaceId: string;
    spaceId: string;
    projectId: string;
    listId: string;
  };
};

export default function HierarchyPage({ params }: HierarchyPageProps): JSX.Element {
  return (
    <main>
      Workspace {params.workspaceId} / Space {params.spaceId} / Project {params.projectId} / List {params.listId}
    </main>
  );
}
