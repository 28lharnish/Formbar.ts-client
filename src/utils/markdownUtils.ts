import {
	type ICommand,
	type TextState,
	TextAreaTextApi,
} from "@uiw/react-md-editor";

function registerTagCommand(
	name: string,
	tag: string,
	shortcuts: string
): ICommand {
	return {
		name,
		keyCommand: name,
		shortcuts,

		execute: (state: TextState, api: TextAreaTextApi) => {
			const { text, selection } = state;

			let start = selection.start;
			let end = selection.end;

			if (start === end) {
				while (start > 0 && !/\s/.test(text[start - 1])) {
					start--;
				}

				while (end < text.length && !/\s/.test(text[end])) {
					end++;
				}
			}

			if (start === end) return;

			const openTag = `<${tag}>`;
			const closeTag = `</${tag}>`;

			const openingTagStart = start - openTag.length;
			const closingTagEnd = end + closeTag.length;

			const alreadyWrapped =
				openingTagStart >= 0 &&
				text.slice(openingTagStart, start) === openTag &&
				text.slice(end, closingTagEnd) === closeTag;

			if (alreadyWrapped) {
				api.setSelectionRange({
					start: openingTagStart,
					end: closingTagEnd,
				});

				api.replaceSelection(text.slice(start, end));

				api.setSelectionRange({
					start: openingTagStart,
					end: openingTagStart + (end - start),
				});

				return;
			}

			const selectedText = text.slice(start, end);

			api.setSelectionRange({
				start,
				end,
			});

			api.replaceSelection(
				`${openTag}${selectedText}${closeTag}`,
			);

			api.setSelectionRange({
				start: start + openTag.length,
				end: start + openTag.length + selectedText.length,
			});
		},
	};
}

const underlineCommand = registerTagCommand("underline", "u", "ctrl+y");
const superscriptCommand = registerTagCommand("superscript", "sup", "ctrl+shift+<");
const subscriptCommand = registerTagCommand("subscript", "sub", "ctrl+shift+>");

const commandArray = [underlineCommand, superscriptCommand, subscriptCommand];

export default commandArray;
