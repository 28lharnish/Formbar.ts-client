import React from "react";
import MDEditor, {
	handleKeyDown,
	shortcuts,
	TextAreaCommandOrchestrator,
	getCommands,
} from "@uiw/react-md-editor";
import commandArray from "@/utils/markdownUtils";
import { Flex, Card } from "antd";
import MarkdownEditor from "@/components/MarkdownEditor";

export default function App() {
	const [value, setValue] = React.useState("**Hello world!!!**");
	const textareaRef = React.useRef<HTMLTextAreaElement>(null);
	const orchestratorRef = React.useRef<TextAreaCommandOrchestrator | null>(
		null,
	);

	

	React.useEffect(() => {
		if (textareaRef.current) {
			orchestratorRef.current = new TextAreaCommandOrchestrator(
				textareaRef.current,
			);
		}
	}, []);

	const allCommands = [...getCommands(), ...commandArray];

	const runCommand = (commandName: string) => {
		const command = allCommands.find(
			(command) => command.name === commandName,
		);

		if (!command || command === undefined || !orchestratorRef.current)
			return;

		orchestratorRef?.current?.executeCommand(command);
		textareaRef.current?.focus();
	};

	const onKeyDown = (e: any) => {
		handleKeyDown(e, 2, false);
		if (orchestratorRef.current) {
			shortcuts(e, allCommands, orchestratorRef.current);
		}
	};

	return (
		<Flex justify="center" align="center" vertical
			style={{
				width: '100%',
				height: '100%'
			}}
		>
			<MarkdownEditor />

				<MDEditor.Markdown
					source={value}
					style={{ whiteSpace: "pre-wrap" }}
				/>
		</Flex>
	);
}
