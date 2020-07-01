const TODO = {
  ACTION: {
    // general
    CREATE: 'create',
    DELETE: 'del',
    // specific
    CREATE_TAG: 'create_tag',
    DELETE_TAG: 'del_tag',
    COMMENT: 'comment',
    // editing/changing
    EDIT_DESCRIPTION: 'edit_desc',
    EDIT_DETAIL: 'edit_detail',
    EDIT_PRIORITY: 'edit_prio',
    EDIT_WORKDATE: 'edit_workdate',
    // marking
    MARK_COMPLETED: 'mark_complete',
    UNMARK_COMPLETED: 'unmark_complete',
    MARK_IMPORTANT: 'mark_important',
    UNMARK_IMPORTANT: 'unmark_important',
  },
  PRIORITY: {
    SUPER: 1,
    URGENT: 2,
    HIGH: 3,
    NORMAL: 4,
    LOW: 5,
    LOWER: 6,
  },
};

export default TODO;
