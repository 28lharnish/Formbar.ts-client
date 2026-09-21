import { Card, Flex, Tooltip, Button, Typography } from "antd";
const { Text } = Typography;
import { useEffect, useRef, type CSSProperties } from "react";
import commandArray from "@/utils/markdownUtils";
import {
	handleKeyDown,
	shortcuts,
	TextAreaCommandOrchestrator,
	getCommands,
} from "@uiw/react-md-editor";
import SanitizedMDView from "./SanitizedMDView";
import { useTheme } from "@/main";

export type MDEditorModes = "Basic" | "Advanced" | "Preview";

export default function MarkdownEditor({
	value,
	setValue,
	mode,
	textAreaStyles,
	chararacterLimit
}:{
	value: string,
	setValue: any,
	mode: MDEditorModes
	textAreaStyles?: CSSProperties,
	chararacterLimit?: number
}) {
	const textareaRef = useRef<HTMLTextAreaElement>(null);
	const orchestratorRef = useRef<TextAreaCommandOrchestrator | null>(
		null,
	);

	const { isDark } = useTheme();

	useEffect(() => {
		if (textareaRef.current) {
			orchestratorRef.current = new TextAreaCommandOrchestrator(
				textareaRef.current,
			);
		}
	}, [mode]);

	function ToolbarButton({
		command,
		children,
	}: {
		command: "bold" | "italic" | "underline" | "strikethrough" | "quote" | "code" | "codeBlock" | "superscript" | "subscript";
		children: any;
	}) {
		const commandTooltips = {
			bold: "Bold (Ctrl + B)",
			italic: "Italic (Ctrl + I)",
			underline: "Underline (Ctrl + Y)",
			strikethrough: "Strikethrough (Ctrl + Shift + X)",
			quote: "Quote (Ctrl + Q)",
			code: "Inline Code (Ctrl + J)",
			codeBlock: "Code Block (Ctrl + Shift + J)",
			superscript: "Superscript (Ctrl + Shift + <)",
			subscript: "Subscript (Ctrl + Shift + >)"
		}

		return (
			<Tooltip title={commandTooltips[command]}>
				<Button style={{aspectRatio: 1.1, padding: 0}} type="primary" onClick={() => runCommand(command)}>
					{children}
				</Button>
			</Tooltip>
		);
	}
	
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
		<>
			<Card
				title={ mode === "Advanced" && (
							<Flex gap={10} justify="space-between">
								<Flex gap={4}>
									<ToolbarButton command="bold">
										<svg
											role="img"
											width="16"
											height="16"
											viewBox="0 0 384 512"
										>
											<path
												fill="currentColor"
												d="M304.793 243.891c33.639-18.537 53.657-54.16 53.657-95.693 0-48.236-26.25-87.626-68.626-104.179C265.138 34.01 240.849 32 209.661 32H24c-8.837 0-16 7.163-16 16v33.049c0 8.837 7.163 16 16 16h33.113v318.53H24c-8.837 0-16 7.163-16 16V464c0 8.837 7.163 16 16 16h195.69c24.203 0 44.834-1.289 66.866-7.584C337.52 457.193 376 410.647 376 350.014c0-52.168-26.573-91.684-71.207-106.123zM142.217 100.809h67.444c16.294 0 27.536 2.019 37.525 6.717 15.828 8.479 24.906 26.502 24.906 49.446 0 35.029-20.32 56.79-53.029 56.79h-76.846V100.809zm112.642 305.475c-10.14 4.056-22.677 4.907-31.409 4.907h-81.233V281.943h84.367c39.645 0 63.057 25.38 63.057 63.057.001 28.425-13.66 52.483-34.782 61.284z"
											></path>
										</svg>
									</ToolbarButton>

									<ToolbarButton command="italic">
										<svg
											data-name="italic"
											width="16"
											height="16"
											role="img"
											viewBox="0 0 320 512"
										>
											<path
												fill="currentColor"
												d="M204.758 416h-33.849l62.092-320h40.725a16 16 0 0 0 15.704-12.937l6.242-32C297.599 41.184 290.034 32 279.968 32H120.235a16 16 0 0 0-15.704 12.937l-6.242 32C96.362 86.816 103.927 96 113.993 96h33.846l-62.09 320H46.278a16 16 0 0 0-15.704 12.935l-6.245 32C22.402 470.815 29.967 480 40.034 480h158.479a16 16 0 0 0 15.704-12.935l6.245-32c1.927-9.88-5.638-19.065-15.704-19.065z"
											></path>
										</svg>
									</ToolbarButton>

									<ToolbarButton command="underline">
										<u style={{ textDecorationThickness: 2 }}>U</u>
									</ToolbarButton>

									<ToolbarButton command="strikethrough">
										<svg
											data-name="strikethrough"
											width="16"
											height="16"
											role="img"
											viewBox="0 0 512 512"
										>
											<path
												fill="currentColor"
												d="M496 288H16c-8.837 0-16-7.163-16-16v-32c0-8.837 7.163-16 16-16h480c8.837 0 16 7.163 16 16v32c0 8.837-7.163 16-16 16zm-214.666 16c27.258 12.937 46.524 28.683 46.524 56.243 0 33.108-28.977 53.676-75.621 53.676-32.325 0-76.874-12.08-76.874-44.271V368c0-8.837-7.164-16-16-16H113.75c-8.836 0-16 7.163-16 16v19.204c0 66.845 77.717 101.82 154.487 101.82 88.578 0 162.013-45.438 162.013-134.424 0-19.815-3.618-36.417-10.143-50.6H281.334zm-30.952-96c-32.422-13.505-56.836-28.946-56.836-59.683 0-33.92 30.901-47.406 64.962-47.406 42.647 0 64.962 16.593 64.962 32.985V136c0 8.837 7.164 16 16 16h45.613c8.836 0 16-7.163 16-16v-30.318c0-52.438-71.725-79.875-142.575-79.875-85.203 0-150.726 40.972-150.726 125.646 0 22.71 4.665 41.176 12.777 56.547h129.823z"
											></path>
										</svg>
									</ToolbarButton>

									<ToolbarButton command="superscript">
										<sup
											style={{
												top: "-0.25em",
												position: "relative",
											}}
										>
											sup
										</sup>
									</ToolbarButton>

									<ToolbarButton command="subscript">
										<sub
											style={{
												bottom: "-0.25em",
												position: "relative",
											}}
										>
											sub
										</sub>
									</ToolbarButton>
								</Flex>

								<Flex gap={4}>
									<ToolbarButton command="quote">
										<svg
											width="16"
											height="16"
											viewBox="0 0 520 520"
										>
											<path
												fill="currentColor"
												d="M520,95.75 L520,225.75 C520,364.908906 457.127578,437.050625 325.040469,472.443125 C309.577578,476.586875 294.396016,464.889922 294.396016,448.881641 L294.396016,414.457031 C294.396016,404.242891 300.721328,395.025078 310.328125,391.554687 C377.356328,367.342187 414.375,349.711094 414.375,274.5 L341.25,274.5 C314.325781,274.5 292.5,252.674219 292.5,225.75 L292.5,95.75 C292.5,68.8257812 314.325781,47 341.25,47 L471.25,47 C498.174219,47 520,68.8257812 520,95.75 Z M178.75,47 L48.75,47 C21.8257813,47 0,68.8257812 0,95.75 L0,225.75 C0,252.674219 21.8257813,274.5 48.75,274.5 L121.875,274.5 C121.875,349.711094 84.8563281,367.342187 17.828125,391.554687 C8.22132813,395.025078 1.89601563,404.242891 1.89601563,414.457031 L1.89601563,448.881641 C1.89601563,464.889922 17.0775781,476.586875 32.5404687,472.443125 C164.627578,437.050625 227.5,364.908906 227.5,225.75 L227.5,95.75 C227.5,68.8257812 205.674219,47 178.75,47 Z"
											></path>
										</svg>
									</ToolbarButton>

									<ToolbarButton command="code">
										<svg
											width="16"
											height="16"
											role="img"
											viewBox="0 0 640 512"
										>
											<path
												fill="currentColor"
												d="M278.9 511.5l-61-17.7c-6.4-1.8-10-8.5-8.2-14.9L346.2 8.7c1.8-6.4 8.5-10 14.9-8.2l61 17.7c6.4 1.8 10 8.5 8.2 14.9L293.8 503.3c-1.9 6.4-8.5 10.1-14.9 8.2zm-114-112.2l43.5-46.4c4.6-4.9 4.3-12.7-.8-17.2L117 256l90.6-79.7c5.1-4.5 5.5-12.3.8-17.2l-43.5-46.4c-4.5-4.8-12.1-5.1-17-.5L3.8 247.2c-5.1 4.7-5.1 12.8 0 17.5l144.1 135.1c4.9 4.6 12.5 4.4 17-.5zm327.2.6l144.1-135.1c5.1-4.7 5.1-12.8 0-17.5L492.1 112.1c-4.8-4.5-12.4-4.3-17 .5L431.6 159c-4.6 4.9-4.3 12.7.8 17.2L523 256l-90.6 79.7c-5.1 4.5-5.5 12.3-.8 17.2l43.5 46.4c4.5 4.9 12.1 5.1 17 .6z"
											></path>
										</svg>
									</ToolbarButton>

									<ToolbarButton command="codeBlock">
										<svg
											width="16"
											height="16"
											role="img"
											viewBox="0 0 156 156"
										>
											<path
												fill="currentColor"
												d="M110.85 120.575 43.7 120.483333 43.7083334 110.091667 110.85 110.191667 110.841667 120.583333 110.85 120.575ZM85.1333334 87.1916666 43.625 86.7083332 43.7083334 76.3166666 85.2083334 76.7916666 85.1333334 87.1916666 85.1333334 87.1916666ZM110.841667 53.4166666 43.7 53.3166666 43.7083334 42.925 110.85 43.025 110.841667 53.4166666ZM36 138C27.2916666 138 20.75 136.216667 16.4 132.666667 12.1333334 129.2 10 124.308333 10 118L10 95.3333332C10 91.0666666 9.25 88.1333332 7.7333334 86.5333332 6.3166668 84.8416666 3.7333334 84 0 84L0 72C3.7333334 72 6.3083334 71.2 7.7333334 69.6 9.2416668 67.9083334 10 64.9333334 10 60.6666666L10 38C10 31.775 12.1333334 26.8833334 16.4 23.3333332 20.7583334 19.7749998 27.2916666 18 36 18L40.6666668 18 40.6666668 30 36 30C34.0212222 29.9719277 32.1263151 30.7979128 30.8 32.2666666 29.3605875 33.8216362 28.5938182 35.8823287 28.6666668 38L28.6666668 60.6666666C28.6666668 67.5083332 26.6666668 72.4 22.6666668 75.3333332 20.9317416 76.7274684 18.8640675 77.6464347 16.6666668 78 18.8916668 78.35 20.8916668 79.2416666 22.6666668 80.6666666 26.6666668 83.95 28.6666668 88.8416666 28.6666668 95.3333332L28.6666668 118C28.6666668 120.308333 29.3750002 122.216667 30.8 123.733333 32.2166666 125.241667 33.9583334 126 36 126L40.6666668 126 40.6666668 138 36 138 36 138ZM114.116667 126 118.783333 126C120.833333 126 122.566667 125.241667 123.983333 123.733333 125.422746 122.178364 126.189515 120.117671 126.116667 118L126.116667 95.3333332C126.116667 88.8333332 128.116667 83.9499998 132.116667 80.6666666 133.9 79.2416666 135.9 78.35 138.116667 78 135.919156 77.6468047 133.851391 76.7277979 132.116667 75.3333332 128.116667 72.3999998 126.116667 67.5 126.116667 60.6666666L126.116667 38C126.189515 35.8823287 125.422746 33.8216361 123.983333 32.2666666 122.657018 30.7979128 120.762111 29.9719277 118.783333 30L114.116667 30 114.116667 18 118.783333 18C127.5 18 133.983333 19.775 138.25 23.3333332 142.608333 26.8833332 144.783333 31.7749998 144.783333 38L144.783333 60.6666666C144.783333 64.9333332 145.5 67.9083332 146.916667 69.6 148.433333 71.2 151.05 72 154.783333 72L154.783333 84C151.05 84 148.433333 84.8333334 146.916667 86.5333332 145.5 88.1333332 144.783333 91.0666666 144.783333 95.3333332L144.783333 118C144.783333 124.308333 142.616667 129.2 138.25 132.666667 133.983333 136.216667 127.5 138 118.783333 138L114.116667 138 114.116667 126 114.116667 126Z"
											></path>
										</svg>
									</ToolbarButton>
								</Flex>
							</Flex>
					)
				}
				style={{
					position: 'relative'
				}}
				styles={{
					header: {
						padding: 4,
						minHeight: 0,
					},
					body: {
						padding: 0,
						overflow: "hidden",
					},
				}}
			>

				{ mode !== "Preview" && (<textarea
					ref={textareaRef}
					value={value}
					onChange={(e) => setValue(e.target.value)}
					onKeyDown={onKeyDown}
					placeholder="Prompt"
					maxLength={chararacterLimit}
					style={{
						width: "100%",
						padding: 8,
						background: isDark ? '#0002' : "#fff2",
						border: "none",
						color: isDark ? 'white' : "black",
						outline: "none",
						borderRadius: 4,
						maxWidth: '100%',
						...textAreaStyles,
					}}
				/>)}

				{ mode === "Preview" && (
					<SanitizedMDView source={value} style={{
						background: 'none',
						color: isDark ? 'white' : "black"
					}} />
				)}

				
				{chararacterLimit && (
					<Text 
						style={{
							width: 'fit-content',
							position: 'absolute',
							bottom: 0,
							right: 8,
							fontSize: 12,
							color: isDark ? '#fffa' : "#000a"
						}}
					>
						<span>{textareaRef?.current?.value.length} </span>
						<span>/ {chararacterLimit}</span>
					</Text>
			)}
			</Card>
		</>
	);
}