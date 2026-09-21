import MDEditor from "@uiw/react-md-editor";
import type { CSSProperties } from "react";
import rehypeSanitize from "rehype-sanitize";

const allowedTags: string[] = [
	'u', // Underline
	'strong', // Bold
	'em', // Italic
	'del', // Strikethrough
	'sup', // Superscript
	'sub', // Subscript
	'code', // Inline / Block Code
	'pre', // Block Code
	'blockquote', // Quote
	'p',
	'img', // Image
	'h1', // Headers
	'h2',
	'h3',
	'h4',
	'h5',
	'h6',
]  

export default function SanitizedMDView({
	source,
	style
}:{
	source: string,
	style?: CSSProperties
}) {
	return (
		<MDEditor.Markdown source={source} style={{
			padding: 8,
			borderRadius: 4,
			marginBottom: 20,
			whiteSpace: 'pre-wrap',
			transition: '0.2s ease-in-out width',
			...style
		}} rehypePlugins={[[rehypeSanitize,  { tagNames: allowedTags }]]}/>
	)
}