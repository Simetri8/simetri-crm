// Firebase services index
// Tum servisleri tek noktadan export eder

export { db, auth } from './config';
export { getCollection, createConverter } from './firestore';

// Entity services
export { companyService } from './companies';
export { contactService } from './contacts';
export { dealService } from './deals';
export { catalogItemService } from './catalog-items';
export { proposalService } from './proposals';
export { workOrderService } from './work-orders';
export { deliverableService } from './deliverables';
export { taskService } from './tasks';
export { activityService } from './activities';
export { timeEntryService } from './time-entries';
export { userService } from './users';
