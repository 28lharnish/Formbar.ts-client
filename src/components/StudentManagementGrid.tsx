import type { Student } from "@/types";
import { Row, Col, Flex, Card, Typography } from "antd";
const { Text } = Typography;
import { IonIcon } from "@ionic/react";
import * as IonIcons from "ionicons/icons";

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
			description: "Help Ticket",
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
							<IonIcon icon={IonIcons.handRightOutline} style={{
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