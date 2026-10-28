import {
	Card,
	Button,
	Modal,
	Flex,
	InputNumber,
	Col,
	Select,
	Tooltip,
	Typography
} from "antd";

const { Text } = Typography;

import { currentUserHasScope } from "@utils/scopeUtils";

import { IonIcon } from "@ionic/react";
import * as IonIcons from "ionicons/icons";
import { useState } from "react";

import {
	getAppearAnimation,
	useUserData,
} from "@/main";
import type { AppSettings } from "@/main";
import { SCOPES } from "@/types";
import type { ManagerPanelUser } from "@pages/ManagerPanel";

import { awardDigipogs as awardDigipogAPI } from "@/api/digipogApi";
import { useGlobalMessage } from "@components/providers/GlobalMessageProvider";
import { messageTemplates } from "@/utils/messageTemplates";
import Log from "@/utils/debugLogger";

function isUnverifiedUser(user: ManagerPanelUser): boolean {
	return Number(user.verified) === 0;
}

function isBannedUser(user: ManagerPanelUser): boolean {
	return (
		Number(user.permissions) === 0 ||
		(user.scopes || []).includes(SCOPES.GLOBAL.SYSTEM.actions.BLOCKED.key)
	);
}

type ManagerPanelUserCardProps = {
	user: ManagerPanelUser;
	index: number;
	mobileCard: boolean;
	isMobile: boolean;
	initialLoad: boolean;
	isLoading: boolean;
	settings: AppSettings;
	onVerify: (userId: number | string) => void;
	onBan: (userId: number | string) => void;
	onUnban: (userId: number | string) => void;
	onDelete: (userId: number | string) => void;
	onPermissionChange: (userId: number | string, permission: number) => void;
};

const permissionLevels = [
	{value: 5, label: "Manager"},
	{value: 4, label: "Teacher"},
	{value: 3, label: "Mod"},
	{value: 2, label: "Student"},
	{value: 1, label: "Guest"},
]

export default function ManagerPanelUserCard({
	user,
	index,
	mobileCard,
	isMobile,
	initialLoad,
	isLoading,
	settings,
	onVerify,
	onBan,
	onUnban,
	onDelete,
	onPermissionChange,
}: ManagerPanelUserCardProps) {
	const globalMessageAPI = useGlobalMessage();
	
	const { userData } = useUserData();
	const canAwardDigipogs = currentUserHasScope(userData, "global.digipogs.award");

	const [extraInfoOpen, setExtraInfoOpen] = useState<boolean>(false);
	const [awardModalOpen, setAwardModalOpen] = useState<boolean>(false);
	const [awardDigipogs, setAwardDigipogs] = useState<number>(0);

	const colStyle =
		initialLoad && !isLoading
			? getAppearAnimation(
					settings.accessibility.disableAnimations,
					index,
				)
			: {};

	const card = (
		<Card
			key={`user-card-${user.id}`}
			title={user.displayName || user.email || "Pending User"}
			styles={{
				title: {
					textAlign: "center",
				},
				body: {
					textAlign: "center",
				},
				root: {
					height: "100%",
				},
			}}
			extra={
				<Button type="primary" style={{
					padding: 0,
					aspectRatio: 1,
				}} onClick={() => setExtraInfoOpen(true)}>
					<IonIcon icon={IonIcons.ellipsisVertical} />
				</Button>
			}
		>
			<Modal
				open={extraInfoOpen}
				title="User Details"
				cancelText="Close"
				okButtonProps={{style:{display:'none'}}}
				onCancel={() => setExtraInfoOpen(false)}
			>
				<Flex vertical>
					<Text>Email: {user.email}</Text>
					<Text>ID: {user.id}</Text>
				</Flex>
			</Modal>
			{!isMobile && (
				<Select
					style={{ width: "100%" }}
					onChange={(e) =>
						onPermissionChange(user.id, e)
					}
					defaultValue={user.permissions}
					disabled={isUnverifiedUser(user) || isBannedUser(user)}
					options={isBannedUser(user) ? [...permissionLevels, {value: 0, label: "Banned"}] : permissionLevels}
				/>
			)}
			<Flex
				gap={10}
				justify="space-evenly"
				style={{ marginTop: "10px" }}
				wrap
			>
				{isMobile && (
					<Select
						style={{ flex: "1 1 auto" }}
						onChange={(e) => onPermissionChange(user.id, e)}
						defaultValue={user.permissions}
						disabled={isUnverifiedUser(user) || isBannedUser(user)}
						options={isBannedUser(user) ? [...permissionLevels, {value: 0, label: "Banned"}] : permissionLevels}
					/>
				)}
				{!isUnverifiedUser(user) && !isBannedUser(user) && canAwardDigipogs ? (
					<Tooltip
						mouseEnterDelay={0.5}
						title={"Award Digipogs"}
						color="blue"
					>
						<Button
							variant="solid"
							color="blue"
							size="large"
							style={{
								padding: "0",
								aspectRatio: 1
							}}
							onClick={() => { setAwardModalOpen(true) }}
						>
							<IonIcon
								icon={IonIcons.cash}
								size="large"
							/>
						</Button>
					</Tooltip>
				) : null}
				{isUnverifiedUser(user) ? (
					<Tooltip
						mouseEnterDelay={0.5}
						title={"Verify User"}
						color="green"
					>
						<Button
							variant="solid"
							color="green"
							size="large"
							style={{
								padding: "0",
								aspectRatio: 1
							}}
							onClick={() => onVerify(user.id)}
						>
							<IonIcon
								icon={IonIcons.checkmarkCircle}
								size="large"
							/>
						</Button>
					</Tooltip>
				) : null}
				{!isBannedUser(user) ? (
					<Tooltip
						mouseEnterDelay={0.5}
						title={"Ban User"}
						color="red"
					>
						<Button
							variant="solid"
							color="red"
							size="large"
							style={{
								padding: "0",
								aspectRatio: 1
							}}
							onClick={() => onBan(user.id)}
						>
							<IonIcon icon={IonIcons.ban} size="large" />
						</Button>
					</Tooltip>
				) : (
					<Tooltip
						mouseEnterDelay={0.5}
						title={"Unban User"}
						color="green"
					>
						<Button
							variant="solid"
							color="green"
							size="large"
							style={{
								padding: "0",
								aspectRatio: 1
							}}
							onClick={() => onUnban(user.id)}
						>
							<IonIcon
								icon={IonIcons.checkmarkCircle}
								size="large"
							/>
						</Button>
					</Tooltip>
				)}
				<Tooltip
					mouseEnterDelay={0.5}
					title={"Delete User"}
					color="red"
				>
					<Button
						variant="solid"
						color="red"
						size="large"
							style={{
								padding: "0",
								aspectRatio: 1
							}}
						onClick={() => onDelete(user.id)}
					>
						<IonIcon icon={IonIcons.trash} size="large" />
					</Button>
				</Tooltip>
			</Flex>
		</Card>
	);

	if (mobileCard) {
		return card;
	}

	const awardModal = (
		<Modal
			title="Award Digipogs"
			okText="Award"
			cancelText="Cancel"
			open={awardModalOpen}
			onCancel={() => {
				setAwardModalOpen(false);
				setAwardDigipogs(0);
			}}
			onOk={() => { 
				awardDigipogAPI({studentId: Number(user.id), amount: awardDigipogs}).then((response) => {
					if (
						response?.success ===
							false ||
						response?.error
					)
						return;
					globalMessageAPI.success(
						messageTemplates.profile_digipogs_transfer_success,
					);
					setAwardModalOpen(
						false,
					);
					setAwardDigipogs(0);
				})
				.catch((error) =>
					Log({
						message:
							"Error transferring digipogs",
						data: error,
						level: "error",
					}),
				);
			}}
			closeIcon={
				<IonIcon icon={IonIcons.close} />
			}
		>
			<Flex
				vertical
				gap={10}
				justify="start"
				align="start"
			>
				<Text>
					Award Digipogs to {user.displayName || user.email || "Pending User"}
				</Text>
				<InputNumber
					style={{ width: "100%" }}
					placeholder="Amount"
					value={awardDigipogs}
					onChange={(value) =>
						setAwardDigipogs(value || 0)
					}
				/>
			</Flex>
		</Modal>
	)

	return (
		<Col span={4} key={`user-col-${user.id}`} style={colStyle}>
			{awardModal}
			{card}
		</Col>
	);
}