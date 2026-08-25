import { Badge, Button, Flex, Row, Modal, Typography } from "antd";
import { useClassData, useUserData } from "@/main";
import { useEffect, useRef } from "react";
const { Text } = Typography;
import { currentUserHasScope } from "@/utils/scopeUtils";
import type { Student } from "@/types";
import StudentManagementGrid from "@components/StudentManagementGrid";

export default function StudentObject({
	student,
	isVoteExcluded,
	onToggleVote,
	openModalId,
	setOpenModalId,
    style,
}: {
	student: Student;
	isVoteExcluded?: boolean;
	onToggleVote?: (studentId: number, exclude: boolean) => void;
	openModalId: number | null;
	setOpenModalId: React.Dispatch<React.SetStateAction<number | null>>;
    style?: React.CSSProperties;
}) {
	const clickTimeoutRef = useRef<number | null>(null);

	const { userData } = useUserData();

	const getStatusText = () => {
		if (student.isOffline) return "Offline";
		if (student.help) return "Help Ticket";
		if (typeof student.break === "string") return "Requesting Break";
		if (typeof student.break === "boolean" && student.break)
			return "On Break";
		if (student.isGuest) return "Guest";
		return "";
	};

	const voteStatusText = isVoteExcluded ? "Voting Disabled" : "Can Vote";
	const statusText = getStatusText();
	const { classData } = useClassData();
	const breakBadge =
		typeof student.break === "string"
			? { text: "Requesting Break", color: "#9ca3af" }
			: typeof student.break === "boolean" && student.break
				? { text: "On Break", color: "#facc15" }
				: null;
	const textResponse = typeof student.pollRes?.textRes === "string" ? student.pollRes.textRes.trim() : "";
	const showTextResponseBadge = Boolean(classData?.poll?.allowTextResponses && textResponse);


	useEffect(() => {
		return () => {
			if (clickTimeoutRef.current !== null) {
				window.clearTimeout(clickTimeoutRef.current);
			}
		};
	}, []);

	function handleButtonClick() {
		if (clickTimeoutRef.current !== null) {
			window.clearTimeout(clickTimeoutRef.current);
		}

		clickTimeoutRef.current = window.setTimeout(() => {
			setOpenModalId(student.id);
			clickTimeoutRef.current = null;
		}, 300);
	}

	function handleButtonDoubleClick() {
		if (clickTimeoutRef.current !== null) {
			window.clearTimeout(clickTimeoutRef.current);
			clickTimeoutRef.current = null;
		}

		if(typeof onToggleVote == 'function') onToggleVote(Number(student.id), !isVoteExcluded);
	}

	const canManageHelp = currentUserHasScope(userData, "class.help.approve");
	const canManageBreak = currentUserHasScope(userData, "class.break.approve");
	const canEndBreaks = currentUserHasScope(userData, "class.break.end");

	const canAssignRoles = currentUserHasScope(userData, "class.roles.assign");
	
	const canAwardDigipogs = currentUserHasScope(userData, "class.digipogs.award");

	const canKick = currentUserHasScope(userData, "class.students.kick");
	const canBan = currentUserHasScope(userData, "class.students.ban");

	return (
		<div key={student.id} style={style}>
			<div>
				<Button
					type="primary"
					style={{
						padding: "5px",
						height: "auto",
						width: "100%",
						opacity: statusText === "Offline" ? 0.5 : 1,
						fontSize: "clamp(12px, 1.5vw, 16px)",
						textOverflow: "ellipsis",
						display: "block",
						position: "relative",
						whiteSpace: "nowrap",
						borderColor: isVoteExcluded ? "#f0ad4e" : undefined,
					}}
					onClick={handleButtonClick}
					onDoubleClick={handleButtonDoubleClick}
				>
					<Flex gap={2} vertical justify="center" style={{ position: "absolute", height: 'calc(100% + 2px)', right: 8, top: 0 }}>
						{student.help ? <Badge color="red" styles={{ root:{ height: 8, lineHeight: 0 }, indicator: { boxShadow: "0 0 3px 0 #000a" }}} /> : null}
						{breakBadge ? <Badge color={breakBadge.color} styles={{ root:{ height: 8, lineHeight: 0 }, indicator: { boxShadow: "0 0 3px 0 #000a" }}} /> : null}
						{showTextResponseBadge ? <Badge color="green" styles={{ root:{ height: 8, lineHeight: 0 }, indicator: { boxShadow: "0 0 3px 0 #000a" }}} /> : null}
					</Flex>
					<Text strong style={{
						fontSize: "clamp(12px, 1.5vw, 16px)",
						overflow: "hidden",
						textOverflow: "ellipsis",
						display: "block",
						whiteSpace: "nowrap"}}>
						{student.displayName}
						{isVoteExcluded ? <span> - {voteStatusText}</span> : null}
						{
							classData?.poll && (
								<span>
									{student.pollRes.buttonRes !== ""
										? (<> <span>-</span> <span style={{color: classData?.poll.responses.find((r: any) => r.answer === student.pollRes.buttonRes)?.color}}>{student.pollRes.buttonRes}</span></>)
										: ""}
								</span>
							)
						}
					</Text>
				</Button>
				<Modal
					centered
					title={
						<Flex vertical>
							{student.displayName}
							<Text
								italic
								type="secondary"
								style={{ fontWeight: 300, fontSize: "16px" }}
							>
								ID: {student.id}
							</Text>
						</Flex>
					}
					zIndex={openModalId === student.id ? 1000 : -100}
					open={openModalId === student.id}
					onCancel={() => setOpenModalId(null)}
					footer={null}
					width={1000}
				>
					<StudentManagementGrid student={student}/>
				</Modal>
			</div>
		</div>
	);
}
