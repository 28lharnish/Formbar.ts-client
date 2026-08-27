import type { ClassData, CurrentUserData, Student } from "@/types";
import { Row, Col, Flex, Card, Typography, Button, notification } from "antd";
const { Text } = Typography;
import { IonIcon } from "@ionic/react";
import * as IonIcons from "ionicons/icons";
import { StudentAccordion } from "./AccordionCollapse";
import { currentUserHasScope } from "@utils/scopeUtils";
import { approveStudentBreak, banClassStudent, deleteHelpRequest, denyStudentBreak, endStudentBreak, kickClassStudent } from "@api/classApi";
import { addRoleToStudent, removeRoleFromStudent } from "@api/rolesApi";

export default function StudentManagementGrid({
	student,
	classData,
	userData
}: {
	student: Student,
	classData: ClassData | null,
	userData: CurrentUserData
}) {

	const canManageHelp = currentUserHasScope(userData, "class.help.approve");
	const canManageBreak = currentUserHasScope(userData, "class.break.approve");
	const canEndBreaks = currentUserHasScope(userData, "class.break.end");

	const canAssignRoles = currentUserHasScope(userData, "class.roles.assign");
	
	const canAwardDigipogs = currentUserHasScope(userData, "class.digipogs.award");

	const canKick = currentUserHasScope(userData, "class.students.kick");
	const canBan = currentUserHasScope(userData, "class.students.ban");

	const [api, contextHolder] = notification.useNotification();

	const showSuccessNotification = (message: string, title: string) => {
		api["success"]({
			title: title,
			description: message,
			placement: "bottom",
		});
	};

	const showErrorNotification = (message: string) => {
		api["error"]({
			title: "Error",
			description: message,
			placement: "bottom",
		});
	};

	type Category = {
		icon: string,
		color: string,
		title: string,
		description: string,

		children: any,
	}

	const categories: Category[] = [
		{
			icon: IonIcons.handRightOutline,
			color: "#ff6860",
			title: 'Help Ticket',
			description: "View and delete this user's help ticket.",
			children: (
				<Flex
					vertical
					justify="center"
					align="center"
					style={{ width: "100%", height: "100%" }}
					gap={10}
				>
					{student.help !== false ?(<>
						<Text type="secondary"
							style={{width: '100%', fontWeight: 300, fontSize: "16px"}}
						>
							Ticket Message
						</Text>
						<Card
							style={{
								width: '100%'
							}}
							styles={{body: {padding: 8}}}
							variant="outlined"
						>
							<Text>
								{student.help.reason
									? student.help.reason
									: ""}
							</Text>
						</Card>
						<Flex style={{width: '100%'}}>
							<Flex align="center" style={{marginRight: 'auto'}}>
								<IonIcon icon={IonIcons.timeOutline} />
								<Text type="secondary" style={{width: '100%', fontWeight: 300, fontSize: "16px", marginLeft: 4}}>Created at: {new Date(student.help.time).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) + " at "  + new Date(student.help.time).toLocaleTimeString("en-US", {hour: 'numeric', minute: '2-digit'})}</Text>
							</Flex>
							<Button
								variant="outlined"
								color="red"
								onClick={async () => {
									if (!canManageHelp) return;
									await deleteHelpRequest(classData?.id!, student.id)
									.then((data) => {
										if(data.success) {
											showSuccessNotification("Deleted help ticket.", "Deleted Help Ticket");
											return;
										}
										showErrorNotification("Failed to delete help ticket.");
									});
								}}
							>
								Delete
							</Button>
						</Flex>
					</>) : (<>
						<Text type="secondary" style={{fontWeight: 300, fontSize: "16px"}}>
							No Help Ticket
						</Text>
					</>)}
					
				</Flex>
			)
		},
		{
			icon: IonIcons.umbrellaOutline,
			color: "#ff8f40",
			title: 'Break Request',
			description: "Manage a user's break",
			children: (
				<Flex
					vertical
					justify="center"
					align="center"
					style={{ width: "100%", height: "100%" }}
					gap={10}
				>
					{student.break !== false ?(<>
						<Text type="secondary"
							style={{width: '100%', fontWeight: 300, fontSize: "16px"}}
						>
							Request Reason
						</Text>
						<Card
							style={{
								width: '100%'
							}}
							styles={{body: {padding: 8}}}
							variant="outlined"
						>
							<Text>
								{student.break
									? student.break
									: ""}
							</Text>
						</Card>
						{
							typeof student.break === "string" ? (
								<>
									<Flex gap={10}>
										<Button
											variant="outlined"
											color="green"
											style={{ width: "120px" }}
											onClick={() => {
												if (!canManageBreak) return;
												approveStudentBreak(classData?.id!, student.id);
											}}
										>
											Approve
										</Button>
										<Button
											variant="outlined"
											color="red"
											style={{ width: "120px" }}
											onClick={() => {
												if (!canManageBreak) return;
												denyStudentBreak(classData?.id!, student.id);
											}}
										>
											Deny
										</Button>
									</Flex>
								</>
							) : (
								<>
									<Flex style={{width: '100%'}}>
										{/* <Flex align="center" style={{marginRight: 'auto'}}>
											<IonIcon icon={IonIcons.timeOutline} />
											<Text type="secondary" style={{width: '100%', fontWeight: 300, fontSize: "16px", marginLeft: 4}}>Created at: {new Date(student.break.time).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) + " at "  + new Date(student.break.time).toLocaleTimeString("en-US", {hour: 'numeric', minute: '2-digit'})}</Text>
										</Flex> */}
										<Button
											variant="outlined"
											color="red"
											onClick={() => {
												if (!canEndBreaks) return;
												endStudentBreak(classData?.id!, student.id);
											}}
										>
											End Break
										</Button>
									</Flex>
								</>
							)
						}
						
					</>) : (<>
						<Text type="secondary" style={{fontWeight: 300, fontSize: "16px"}}>
							No Break
						</Text>
					</>)}
					
				</Flex>
			)
		},
		{
			icon: IonIcons.textOutline,
			color: "#ffdf40",
			title: 'Response',
			description: "The user's current poll response.",
			children: 'hi!'
		},
		{
			icon: IonIcons.cashOutline,
			color: "#81ff81",
			title: 'Digipogs',
			description: "Award Digipogs to this user.",
			children: 'hi!'
		},
		{
			icon: IonIcons.lockClosedOutline,
			color: "#bfcfff",
			title: 'Roles',
			description: "Manage roles for this user.",
			children: 'hi!'
		},
		{
			icon: IonIcons.banOutline,
			color: "#df80ff",
			title: 'Management',
			description: "Manage this user.",
			children: 'hi!'
		}
	]

	function createGridItem(category: Category) {


		return (
			<Col span={8}>
				<Card styles={{
					header: {
						padding: 0
					},
					body: {
						padding: '8px 16px'
					}
				}} title={
					<Flex vertical style={{padding: 8}}>
						<Flex align="center">
							<IonIcon icon={category.icon} style={{
								fontSize: "30px",
								color: category.color,
								margin: "8px",
							}}/>
							<Text>
								{category.title}
							</Text>
						</Flex>
						<Text type="secondary" style={{fontWeight: 400, fontSize: 16, paddingLeft: 8}}>
							{category.description}
						</Text>
					</Flex>
				}>
					{category.children}
					<StudentAccordion studentData={student}/>
				</Card>
			</Col>
		)
	}

	return (<>{contextHolder}
		<Row gutter={[8, 8]}>
			{categories.map((category) => createGridItem(category))}
		</Row>
	</>)
}