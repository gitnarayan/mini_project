import Workspace from '@/components/workspace';
import Tasks from '@/components/tasks';
export default async function ProjectPage({ params }: { params: Promise<{ projectId: string }> }) { const { projectId } = await params; return <Workspace><Tasks projectId={projectId} /></Workspace>; }
