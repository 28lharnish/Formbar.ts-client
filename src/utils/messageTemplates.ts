export const messageTemplates = {
	fallback: "Something went wrong. Please try again.",

	// Pools and users
	user_pool_added_success: (
		userId: string | number,
		poolId: string | number,
	) => `User ${userId} added to pool ${poolId}`,
	user_pool_removed_success: (
		userId: string | number,
		poolId: string | number,
	) => `User ${userId} removed from pool ${poolId}`,
	user_pool_payout_failed: "Failed to payout the pool. Please try again.",
	user_pool_add_failed:
		"Failed to add the user to the pool. Please try again.",
	user_pool_remove_failed: (userId: string | number) =>
		`Failed to remove user ${userId} from the pool. Please try again.`,
	user_pool_deleted_failed: "Failed to delete the pool. Please try again.",
	user_digipogs_awarded_success: (amount: number) =>
		`Awarded ${amount} digipogs to student.`,
	user_digipogs_award_failed: "Failed to award digipogs.",
	user_kick_success: (userId: string | number) =>
		`User ${userId} kicked from the class.`,
	user_ban_success: (userId: string | number) =>
		`User ${userId} banned from the class.`,
	user_kick_failed: "Failed to kick user.",
	user_ban_failed: "Failed to ban user.",
	user_verified_success: "User verified successfully.",
	user_verify_failed: "Failed to verify user.",
	user_deleted_success: "User deleted successfully.",
	user_delete_failed: "Failed to delete user.",
	user_banned_success: "User banned successfully.",
	user_banned_failed: "Failed to ban user.",
	user_unbanned_success: "User unbanned successfully.",
	user_unbanned_failed: "Failed to unban user.",
	user_roles_updated_success: "Student roles updated.",
	user_roles_update_failed: "Failed to update student roles.",
	user_helpTicket_deleted_success: "Deleted help ticket.",
	user_helpTicket_delete_failed: "Failed to delete help ticket.",
	user_break_approved_success: "Break request approved.",
	user_break_denied_success: "Break request denied.",
	user_break_ended_success: "Student break ended.",
	user_break_approve_failed: "Failed to approve break request.",
	user_break_deny_failed: "Failed to deny break request.",
	user_break_end_failed: "Failed to end student break.",

	// Polls
	poll_name_required_error: "Please enter a poll name.",
	poll_class_required_error: "No active class to save this poll.",
	poll_class_inactive_error: "Class is not active.",
	poll_save_success: "Poll saved successfully!",
	poll_save_failed: "Failed to save poll.",
	poll_answer_remove_error: 'Poll answer cannot be "remove".',
	poll_prompt_required_error: "Poll requires a prompt.",
	poll_fetch_failed: "Failed to fetch previous polls.",

	// Classes and links
	class_links_permission_error: "You do not have permission to manage links.",
	class_links_fields_required_error:
		"Please fill out both the link name and URL.",
	class_links_add_failed: "Failed to add link.",
	class_links_add_error: "An error occurred while adding the link.",
	class_links_remove_failed: "Failed to remove link.",
	class_links_remove_error: "An error occurred while removing the link.",
	class_links_added_success: "Class link added successfully.",
	class_links_removed_success: "Class link removed successfully.",
	class_deleted_success: "Class deleted successfully.",
	class_delete_failed:
		"An unexpected error occurred while deleting the class.",
	class_load_failed: "Failed to load your classes.",
	class_delete_confirmation_title:
		"Are you sure you want to delete this class?",
	class_delete_confirmation_content:
		"This action is irreversible, and you will not be able to recover this class.",
	class_students_kicked_success: "All students were kicked from the class.",
	class_students_kick_failed: "Failed to kick students from the class.",
	class_code_regenerated_success: "Class code regenerated successfully.",
	class_code_regenerate_failed: "Failed to regenerate class code.",
	class_name_updated_success: "Class name updated successfully.",
	class_name_update_failed: "Failed to update class name.",
	class_selection_required_error: "No class selected.",

	// Pool management
	pool_name_required_error: "Pool name is required.",
	pool_create_failed: "Failed to create the pool. Please try again.",
	pool_delete_failed: "Failed to delete the pool. Please try again.",
	pool_payout_success: "Pool payout completed successfully.",
	pool_created_success: "Pool created successfully.",
	pool_deleted_success: "Pool deleted successfully.",

	// User management confirmations
	user_delete_confirmation_title:
		"Are you sure you want to delete this user?",
	user_ban_confirmation_title: "Are you sure you want to ban this user?",
	user_unban_confirmation_title: "Are you sure you want to unban this user?",
	user_delete_confirmation_content: (userLabel: string) =>
		`${userLabel} will be unable to log in and removed from all classes.`,
	user_ban_confirmation_content: (displayName: string) =>
		`${displayName} will be unable to login or create a new account with this email`,
	user_unban_confirmation_content: (displayName: string) =>
		`${displayName} will now be able to login or create a new account with this email`,

	// Inventory and authentication
	inventory_load_failed: "Failed to load inventory. Please try again.",
	inventory_item_delete_failed: "Failed to delete item. Please try again.",
	inventory_refresh_failed: "Failed to refresh inventory. Please try again.",
	auth_generic_error: "Something went wrong. Please try again.",

	// PIN and profile
	pin_resetToken_missing_error: "Reset token is missing.",
	pin_format_error: "PIN must be 4-6 numeric digits.",
	pin_confirmation_mismatch_error: "PIN values do not match.",
	pin_reset_success: "PIN reset successfully.",
	pin_reset_failed: "PIN reset failed.",
	pin_create_failed: "Failed to create PIN.",
	pin_create_success: "PIN created successfully.",
	pin_invalid_error: "Enter a valid 4-6 digit PIN.",
	pin_updated_success: "PIN updated successfully.",
	pin_update_failed: "Failed to update PIN.",
	pin_reset_requested_success: "PIN reset email sent.",
	pin_reset_request_failed: "Failed to request PIN reset.",

	profile_apiKey_regenerated_success: "API key regenerated successfully.",
	profile_apiKey_copied_success: "API key copied to clipboard.",
	profile_digipogs_transfer_success: "Digipogs transferred successfully.",
	profile_apiKey_regenerate_failed: "Failed to regenerate API key.",
} as const;

export type MessageTemplateId = keyof typeof messageTemplates;
