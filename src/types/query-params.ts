export interface CreateUserQueryParams {
  loginAfterCreate?: boolean;
}

export interface IQuery {
  role?: string;
  roles?: string;
  username?: RegExp | string;
  isAffiliate?: boolean;
  isActive?: boolean;
  _id?: string | { $ne: string };
}
