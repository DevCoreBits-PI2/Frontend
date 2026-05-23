// Catálogo central de paths del Gateway (todos sin el prefijo /api porque
// NEXT_PUBLIC_API_URL ya termina en /api).
//
// Fuente de verdad: controllers en
//   Human-Talent-Managment-App-Launcher/gateway/src/**/*.controller.ts
//
// No tocar el backend; si una ruta cambia allá, actualizar acá.

export const AREAS = {
  create: "/administrative-data/areas/create-area",
  findAll: "/administrative-data/areas/find-all-areas",
  findOne: (id: number | string) => `/administrative-data/areas/find-area/${id}`,
  update: (id: number | string) => `/administrative-data/areas/update-area/${id}`,
  remove: (id: number | string) => `/administrative-data/areas/delete-area/${id}`,
};

export const POSITIONS = {
  create: "/administrative-data/positions/create-position",
  findAll: "/administrative-data/positions/find-all-positions",
  findOne: (id: number | string) => `/administrative-data/positions/find-position/${id}`,
  update: (id: number | string) => `/administrative-data/positions/update-position/${id}`,
  remove: (id: number | string) => `/administrative-data/positions/delete-position/${id}`,
  tree: "/administrative-data/positions/positions-tree",
  removeFather: (id: number | string) => `/administrative-data/positions/remove-father/${id}`,
};

export const CONTRACTS = {
  create: "/administrative-data/contracts/create-contract",
  findAll: "/administrative-data/contracts/find-all-contracts",
  findOne: (id: number | string) => `/administrative-data/contracts/find-contract/${id}`,
  stats: "/administrative-data/contracts/stats",
  update: (id: number | string) => `/administrative-data/contracts/update-contract/${id}`,
  remove: (id: number | string) => `/administrative-data/contracts/delete-contract/${id}`,
  renew: (id: number | string) => `/administrative-data/contracts/renew-contract/${id}`,
  byEmployee: (id: number | string) => `/administrative-data/contracts/find-contracts-by-employee/${id}`,
};

export const EMPLOYEES = {
  invite: "/employees/inviteUser",
  findAll: "/employees/findAll",
  findOne: (id: number | string) => `/employees/${id}`,
  generateQr: (id: number | string) => `/employees/${id}/qr`,
  scanQr: "/employees/qr/scan",
  myProfile: (id: number | string) => `/employees/getMyProfile/${id}`,
  subordinates: (id: number | string) => `/employees/getSubordinates/${id}`,
  updateProfile: (id: number | string) => `/employees/updateUser/${id}`,
  updateEmployee: (id: number | string) => `/employees/updateEmployee/${id}`,
  firstTimeSetup: (id: number | string) => `/employees/firstTimeSetup/${id}`,
  completeFirstLogin: (id: number | string) => `/employees/completeFirstLogin/${id}`,
  // PATCH multipart/form-data con campo `file`. El backend resuelve el
  // empleado destino desde el JWT (employeeId) y sube a Cloudinary; persiste
  // `photo_url` y `public_id` en el registro del empleado.
  uploadProfileImage: "/employees/upload-profile-image",
};

export const ADMIN = {
  create: "/admin/create-admin",
  findAll: "/admin/admin",
  findOne: (id: number | string) => `/admin/${id}`,
  block: (id: number | string) => `/admin/blockUser/${id}`,
  unblock: (id: number | string) => `/admin/unblockUser/${id}`,
  suspend: (id: number | string) => `/admin/suspendEmployee/${id}`,
  resendInvitation: (id: number | string) => `/admin/resendInvitation/${id}`,
};

export const AUTH = {
  login: "/auth/login",
  loginOtp: "/auth/login-otp",
  verifyOtp: "/auth/verify-otp",
};

export const CAREER_HISTORY = {
  create: "/create-career-history",
  findAll: "/find-all-career-history",
  byEmployee: (id: number | string) => `/find-career-history-by-employee/${id}`,
  findOne: (id: number | string) => `/find-career-history/${id}`,
  update: (id: number | string) => `/update-career-history/${id}`,
  remove: (id: number | string) => `/delete-career-history/${id}`,
};

export const PERFORMANCE = {
  create: "/create-performance-evaluation",
  findAll: "/find-all-performance-evaluation",
  findOne: (id: number | string) => `/find-performance-evaluation/${id}`,
  byEmployee: (id: number | string) => `/find-performance-evaluations-by-employee/${id}`,
  generateReport: "/generate-performance-evaluation-report",
  generateAreaReport: "/generate-performance-evaluation-report-by-area",
  update: (id: number | string) => `/update-performance-evaluation/${id}`,
  remove: (id: number | string) => `/delete-performance-evaluation/${id}`,
};
