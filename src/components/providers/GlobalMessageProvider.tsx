import { message } from "antd";
import { createContext, useContext } from "react";
import { useEffect } from "react";
import type { ReactNode } from "react";
import { registerApiErrorReporter } from "@api/HTTPApi";

type MessageApi = ReturnType<typeof message.useMessage>[0];

type GlobalMessageFunctions = {
	success: MessageApi["success"];
	error: MessageApi["error"];
	warning: MessageApi["warning"];
};

const GlobalMessageContext = createContext<GlobalMessageFunctions | null>(null);

export function GlobalMessageProvider({ children }: { children: ReactNode }) {
	const [messageApi, contextHolder] = message.useMessage({
		maxCount: 3,
	});
	const functions: GlobalMessageFunctions = {
		success: messageApi.success,
		error: messageApi.error,
		warning: messageApi.warning,
	};

	useEffect(() => {
		return registerApiErrorReporter((error) => messageApi.error(error));
	}, [messageApi]);

	return (
		<GlobalMessageContext.Provider value={functions}>
			{contextHolder}
			{children}
		</GlobalMessageContext.Provider>
	);
}

export function useGlobalMessage(): GlobalMessageFunctions {
	const functions = useContext(GlobalMessageContext);

	if (!functions) {
		throw new Error(
			"useGlobalMessage must be used within GlobalMessageProvider",
		);
	}

	return functions;
}
