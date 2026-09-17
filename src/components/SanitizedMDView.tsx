import MDEditor from "@uiw/react-md-editor";
import rehypeSanitize from "rehype-sanitize";

export default function SanitizedMDView({
	source
}:{
	source: string
}) {
	return (
		<MDEditor.Markdown source={source} style={{
			padding: 8,
			borderRadius: 4,
			marginBottom: 20,
			whiteSpace: 'pre-wrap',
			transition: '0.2s ease-in-out width'
		}} rehypePlugins={[rehypeSanitize]}/>
	)
}