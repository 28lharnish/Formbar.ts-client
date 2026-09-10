import type { InventoryItem } from "@/types";
import { Image, Tooltip, Typography, Flex, Col, Modal, InputNumber } from "antd";
import { useState } from "react";
const { Title, Text } = Typography;

export default function InventoryItemElement({
	isMe,
	item,
	deleteFunction
}: {
	isMe: boolean,
	item: InventoryItem,
	deleteFunction: Function
}) {
	const [isModalOpen, openModal] = useState(false);
	const [itemDeleteQuantity, setDeleteQuantity] = useState(1);
	
	return (
		<Col>
			<Modal open={isModalOpen} okText="Delete" okType="danger" onCancel={() => openModal(false)} title={
				<Flex align="start" gap={16} style={{marginBottom:8}}>
					<Image style={{ width: '100px', height: '100px', borderRadius: 6 }} src={
						item.image_url ? item.image_url : "https://placehold.co/600x600?text=No+Image"
					} preview={false}/>
					<Flex vertical style={{ marginTop: 8 }}>
						<Title style={{fontSize: 36, marginBottom: 0}}>{item.name}</Title>
						<Text style={{fontSize: 16}}>{item.description}</Text>
					</Flex>
				</Flex>
			} onOk={() => deleteFunction(item.id, itemDeleteQuantity)}>
				<Text>
					How many of this item would you like to remove from {isMe ? "your" : "this user's"} inventory?
				</Text>
				
				<InputNumber
					style={{width:'100%', marginTop: 12}}
					placeholder="Quantity"
					value={itemDeleteQuantity}
					onChange={(value) => setDeleteQuantity(value || 0)}
					min={1}
					max={item.quantity}
					suffix={`/ ${item.quantity}`}
				/>
			</Modal>
			<Flex
				style={{width: '100px', height: '100px', cursor: 'pointer'}}>
				<Tooltip mouseEnterDelay={0.5} title={(
					<>
						<Title style={{fontSize: 36, marginBottom: 0}}>{item.name}</Title>
						<Text style={{fontSize: 16}}>{item.description}</Text>
					</>
				)}>
					<Flex onClick={() => openModal(true)} style={{ width: '100px', height: '100px', position: 'relative' }}>
						<Text style={{filter: 'drop-shadow(0 0 4px black)', fontSize: 36, position: 'absolute', right: 10, bottom: 10, lineHeight: 1}}>
							{item.quantity}
						</Text>
						<Image style={{ width: '100px', height: '100px', borderRadius: 8 }} styles={{ root: { position: 'absolute', zIndex: '-1' } }} src={
							item.image_url ? item.image_url : "https://placehold.co/600x600?text=No+Image"
						} preview={false}/>
					</Flex>
				</Tooltip>
			</Flex>
		</Col>
	)
}