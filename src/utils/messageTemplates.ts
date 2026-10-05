export const messageTemplates = {
	// Pools and users
	"user.pool.added.success": (
		userId: string | number,
		poolId: string | number,
	) => `User ${userId} added to pool ${poolId}`,
	"user.pool.removed.success": (
		userId: string | number,
		poolId: string | number,
	) => `User ${userId} removed from pool ${poolId}`,
	"user.pool.payout.failed": "Failed to payout the pool. Please try again.",
	"user.pool.add.failed": "Failed to add the user to the pool. Please try again.",
	"user.pool.remove.failed": (userId: string | number) =>
		`Failed to remove user ${userId} from the pool. Please try again.`,
	"user.pool.deleted.failed": "Failed to delete the pool. Please try again.",
	"user.digipogs.awarded.success": (amount: number) =>
		`Awarded ${amount} digipogs to student.`,
	"user.digipogs.award.failed": "Failed to award digipogs.",
	"user.kick.success": (userId: string | number) =>
		`User ${userId} kicked from the class.`,
	"user.ban.success": (userId: string | number) =>
		`User ${userId} banned from the class.`,
	"user.kick.failed": "Failed to kick user.",
	"user.ban.failed": "Failed to ban user.",
	"user.verified.success": "User verified successfully.",
	"user.verify.failed": "Failed to verify user.",
	"user.deleted.success": "User deleted successfully.",
	"user.delete.failed": "Failed to delete user.",
	"user.banned.success": "User banned successfully.",
	"user.banned.failed": "Failed to ban user.",
	"user.unbanned.success": "User unbanned successfully.",
	"user.unbanned.failed": "Failed to unban user.",
	"user.roles.updated.success": "Student roles updated.",
	"user.roles.update.failed": "Failed to update student roles.",
	"user.helpTicket.deleted.success": "Deleted help ticket.",
	"user.helpTicket.delete.failed": "Failed to delete help ticket.",
	"user.break.approved.success": "Break request approved.",
	"user.break.denied.success": "Break request denied.",
	"user.break.ended.success": "Student break ended.",
	"user.break.approve.failed": "Failed to approve break request.",
	"user.break.deny.failed": "Failed to deny break request.",
	"user.break.end.failed": "Failed to end student break.",

	// Polls
	"poll.name.required.error": "Please enter a poll name.",
	"poll.class.required.error": "No active class to save this poll.",
	"poll.class.inactive.error": "Class is not active.",
	"poll.save.success": "Poll saved successfully!",
	"poll.save.failed": "Failed to save poll.",
	"poll.answer.remove.error": 'Poll answer cannot be "remove".',
	"poll.prompt.required.error": "Poll requires a prompt.",
	"poll.fetch.failed": "Failed to fetch previous polls.",

	// Classes and links
	"class.links.permission.error": "You do not have permission to manage links.",
	"class.links.fields.required.error": "Please fill out both the link name and URL.",
	"class.links.add.failed": "Failed to add link.",
	"class.links.add.error": "An error occurred while adding the link.",
	"class.links.remove.failed": "Failed to remove link.",
	"class.links.remove.error": "An error occurred while removing the link.",
	"class.links.added.success": "Class link added successfully.",
	"class.links.removed.success": "Class link removed successfully.",
	"class.deleted.success": "Class deleted successfully.",
	"class.delete.failed": "An unexpected error occurred while deleting the class.",
	"class.load.failed": "Failed to load your classes.",
	"class.delete.confirmation.title": "Are you sure you want to delete this class?",
	"class.delete.confirmation.content":
		"This action is irreversible, and you will not be able to recover this class.",
	"class.students.kicked.success": "All students were kicked from the class.",
	"class.students.kick.failed": "Failed to kick students from the class.",
	"class.code.regenerated.success": "Class code regenerated successfully.",
	"class.code.regenerate.failed": "Failed to regenerate class code.",
	"class.name.updated.success": "Class name updated successfully.",
	"class.name.update.failed": "Failed to update class name.",
	"class.selection.required.error": "No class selected.",

	// Pool management
	"pool.name.required.error": "Pool name is required.",
	"pool.create.failed": "Failed to create the pool. Please try again.",
	"pool.delete.failed": "Failed to delete the pool. Please try again.",
	"pool.payout.success": "Pool payout completed successfully.",
	"pool.created.success": "Pool created successfully.",
	"pool.deleted.success": "Pool deleted successfully.",

	// User management confirmations
	"user.delete.confirmation.title": "Are you sure you want to delete this user?",
	"user.ban.confirmation.title": "Are you sure you want to ban this user?",
	"user.unban.confirmation.title": "Are you sure you want to unban this user?",
	"user.delete.confirmation.content": (userLabel: string) =>
		`${userLabel} will be unable to log in and removed from all classes.`,
	"user.ban.confirmation.content": (displayName: string) =>
		`${displayName} will be unable to login or create a new account with this email`,
	"user.unban.confirmation.content": (displayName: string) =>
		`${displayName} will now be able to login or create a new account with this email`,

	// Inventory and authentication
	"inventory.load.failed": "Failed to load inventory. Please try again.",
	"inventory.item.delete.failed": "Failed to delete item. Please try again.",
	"inventory.refresh.failed": "Failed to refresh inventory. Please try again.",
	"auth.generic.error": "Something went wrong. Please try again.",

	// PIN and profile
	"pin.resetToken.missing.error": "Reset token is missing.",
	"pin.format.error": "PIN must be 4-6 numeric digits.",
	"pin.confirmation.mismatch.error": "PIN values do not match.",
	"pin.reset.success": "PIN reset successfully.",
	"pin.reset.failed": "PIN reset failed.",
	"profile.apiKey.regenerated.success": "API key regenerated successfully.",
	"profile.apiKey.copied.success": "API key copied to clipboard.",
	"profile.digipogs.transfer.success": "Digipogs transferred successfully.",
	"profile.apiKey.regenerate.failed": "Failed to regenerate API key.",
	"profile.pin.updated.success": "PIN updated successfully.",
	"profile.pin.update.failed": "Failed to update PIN.",
	"profile.pinReset.requested.success": "PIN reset email sent.",
	"profile.pinReset.request.failed": "Failed to request PIN reset.",
	"profile.pin.invalid.error": "Enter a valid 4-6 digit PIN.",
	"profile.pin.create.success": "PIN created successfully.",
	"profile.pin.create.failed": "Failed to create PIN.",
} as const;

export type MessageTemplateId = keyof typeof messageTemplates;
