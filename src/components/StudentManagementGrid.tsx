import type { Student } from "@/types";
import { Row, Col, Flex, Card, Typography } from "antd";
const { Text } = Typography;
import { IonIcon } from "@ionic/react";
import * as IonIcons from "ionicons/icons";
import { StudentAccordion } from "./AccordionCollapse";

export default function StudentManagementGrid({
	student
}: {
	student: Student
}) {

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
			children: 'hi!'
		},
		{
			icon: IonIcons.umbrellaOutline,
			color: "#ff8f40",
			title: 'Break Request',
			description: "Breaks",
			children: 'hi!'
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
						padding: 8
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

	return (
		<Row gutter={[8, 8]}>
			{categories.map((category) => createGridItem(category))}
		</Row>
	)
}