import {
	Col,
	Flex,
	FloatButton,
	Input,
	Modal,
	Pagination,
	Row,
	Spin,
	Typography,
	notification,
} from "antd";
const { Text, Title } = Typography;
import FormbarHeader from "@components/FormbarHeader";
import Log from "@utils/debugLogger";
import { IonIcon } from "@ionic/react";
import * as IonIcons from "ionicons/icons";
import { useUserData } from "@/main";
import { useEffect, useState } from "react";
import { getUserPools } from "@api/userApi";
import type { PogPool } from "@/types";
import {
	createPool,
} from "@api/pogPoolsApi";
import { currentUserHasScope } from "@/utils/scopeUtils";
import PogPoolElement from "@/components/PogPool";

const DEFAULT_PAGE_SIZE = 6;

function parsePools(responseData: unknown): PogPool[] {
	const data = responseData as {
		poolItems?: unknown;
		pools?: unknown;
	};

	if (Array.isArray(data?.poolItems)) {
		return data.poolItems as PogPool[];
	}

	if (Array.isArray(data?.pools)) {
		return data.pools as PogPool[];
	}

	if (typeof data?.pools === "string") {
		try {
			const parsed = JSON.parse(data.pools);
			return Array.isArray(parsed) ? (parsed as PogPool[]) : [];
		} catch {
			return [];
		}
	}

	return [];
}

export default function PogPools() {
	const { userData } = useUserData();
	const [pools, setPools] = useState<PogPool[]>([]);
	const [error, setError] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [currentPage, setCurrentPage] = useState(1);
	const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
	const [totalPools, setTotalPools] = useState(0);
	const [api, contextHolderNotification] = notification.useNotification();

	const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
	const [poolName, setPoolName] = useState("");
	const [poolDesc, setPoolDesc] = useState("");

	useEffect(() => {
		if (!userData) return;

		refreshPools();
	}, [userData, currentPage, pageSize]);

	const refreshPools = () => {
		if (!userData) return;
		const offset = (currentPage - 1) * pageSize;
		setIsLoading(true);

		getUserPools(String(userData.id), pageSize, offset)
			.then((response) => {
				const { data } = response;
				Log({ message: "Fetched pools", data });
				const poolItems = parsePools(data);
				const total =
					typeof data?.pagination?.total === "number"
						? data.pagination.total
						: poolItems.length;
				setPools(poolItems);
				setTotalPools(total);
				setError(null);
			})
			.catch((err) => {
				Log({
					message: "Error fetching pools",
					data: err,
					level: "error",
				});
				setError("Failed to fetch pools.");
			})
			.finally(() => {
				setIsLoading(false);
			});
	};

	const handleCreatePool = () => {
		if (!poolName.trim()) {
			api["error"]({
				title: "Validation Error",
				description: "Pool name is required.",
				placement: "bottom",
			});

			return;
		}

		Log({ message: `Creating pool: ${poolName}` });
		createPool({ name: poolName, description: poolDesc })
			.then(() => {
				Log({ message: `Pool ${poolName} created successfully` });
				setPoolName("");
				setPoolDesc("");
				setIsCreateModalOpen(false);
				refreshPools();
			})
			.catch((err) => {
				Log({
					message: `Error creating pool`,
					data: err,
					level: "error",
				});
				api["error"]({
					title: "Error Creating Pool",
					description: `Failed to create the pool. Please try again.`,
					placement: "bottom",
				});
			});
	};

	const canManagePools = currentUserHasScope(userData, "global.pools.manage");

	return (
		<>
			{contextHolderNotification}
			<FormbarHeader />
			<div
				style={{
					height: "calc(100vh - 80px)",
					overflowY: "auto",
					overflowX: "hidden",
					WebkitOverflowScrolling: "touch",
				}}
			>
				<Title style={{ textAlign: "center", marginTop: "20px" }}>
					Pog Pools
				</Title>

				<Row
					gutter={[16, 16]}
					style={{
						margin: "20px",
					}}
				>
					{isLoading && (
						<Col span={24}>
							<Flex justify="center">
								<Spin />
							</Flex>
						</Col>
					)}

					{!isLoading &&
						pools.map((pool) => {
							return (
								<Col xs={24} sm={12} lg={8} key={pool.id}>
									<PogPoolElement pool={pool} refreshPools={refreshPools} />
								</Col>
							);
						})}

					{!isLoading && !error && pools.length === 0 && (
						<Col span={24}>
							<Text
								type="secondary"
								style={{
									display: "block",
									textAlign: "center",
								}}
							>
								No pools found.
							</Text>
						</Col>
					)}

					{error && (
						<Col span={24}>
							<Text
								type="danger"
								style={{
									display: "block",
									textAlign: "center",
								}}
							>
								{error}
							</Text>
						</Col>
					)}
				</Row>

				{totalPools > 0 && (
					<Flex
						justify="center"
						style={{ marginBottom: "32px", marginTop: "20px" }}
					>
						<Pagination
							current={currentPage}
							pageSize={pageSize}
							total={totalPools}
							showSizeChanger
							pageSizeOptions={[6, 12, 24, 48]}
							defaultPageSize={6}
							onChange={(page, size) => {
								setIsLoading(true);
								setCurrentPage(page);
								setPageSize(size);
							}}
						/>
					</Flex>
				)}
			</div>
			{canManagePools && (
				<FloatButton
					shape="circle"
					type="primary"
					tooltip={{
						title: "Create Pool",
						placement: "left",
						color: "blue",
					}}
					styles={{
						root: {
							width: "64px",
							height: "64px",
						},
					}}
					onClick={() => setIsCreateModalOpen(true)}
					icon={
						<IonIcon
							icon={IonIcons.add}
							style={{
								fontSize: "36px",
								display: "flex",
							}}
						/>
					}
				/>
			)}{" "}
			{/* Create Pool modal */}
			<Modal
				title="Create Pool"
				open={isCreateModalOpen}
				onCancel={() => {
					setPoolName("");
					setPoolDesc("");
					setIsCreateModalOpen(false);
				}}
				onOk={handleCreatePool}
				okText="Create"
				cancelText="Cancel"
			>
				<Flex vertical gap={16} style={{ marginTop: "16px" }}>
					<Input
						placeholder="Enter pool name"
						value={poolName}
						onChange={(e) => setPoolName(e.target.value)}
					/>
					<Input.TextArea
						placeholder="Enter pool description"
						value={poolDesc}
						onChange={(e) => setPoolDesc(e.target.value)}
						rows={4}
					/>
				</Flex>
			</Modal>
		</>
	);
}
