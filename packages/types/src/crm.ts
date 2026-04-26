// CRM Module Types

export interface LeadCreateInput {
  firstName: string;
  lastName?: string;
  email?: string;
  mobileNo?: string;
  organizationId?: string;
  statusId?: string;
  leadOwnerId?: string;
}

export interface DealCreateInput {
  organizationId?: string;
  statusId?: string;
  dealOwnerId?: string;
  dealValue?: number;
  expectedClosureDate?: Date;
}

export interface ContactCreateInput {
  firstName: string;
  lastName?: string;
  email: string;
  organizationId?: string;
  jobTitle?: string;
}
