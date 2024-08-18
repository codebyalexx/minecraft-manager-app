import { CodeBlock } from "@/components/code-block";
import { ErrorMessage } from "@/components/error-message";
import { ServerSettings } from "@/components/server-settings";
import { getServer } from "@/queries/server.query";

export default async function page({ params }: { params: { id: string } }) {
    const serverData = await getServer(params.id)

    if (!serverData) return <div>
        <ErrorMessage>The server <CodeBlock inline>{params.id}</CodeBlock> cannot be found in the database.</ErrorMessage>
    </div>

    const { cmdline, label, path } = serverData

    return <div className="w-full flex items-center justify-center">
        <ServerSettings defaultFormData={{
            cmdline: "",
            label: "",
            path: ""
        }} />
    </div>;
}