import { AbilityBuilder, Ability } from "@casl/ability";
import { createPrismaAbility, PrismaQuery, Subjects } from "@casl/prisma";
import { Injectable } from "@nestjs/common";
import {
  AuthUser,
  Role,
  Permission,
  Attendance,
  PayrollRun,
  Lead,
  Deal,
  Department,
  Designation,
  Employee,
  LeaveApplication,
  Project,
  Task,
  Invoice,
  Payment,
  Vendor,
  PurchaseOrder,
  Warehouse,
  Product,
  Appraisal,
  EmployeeGoal,
  HelpdeskTicket,
  TicketComment,
  TaxExemptionDeclaration,
  Holiday,
  CompanyEvent,
} from "@atlas/database";

export type Action =
  | "manage"
  | "create"
  | "read"
  | "update"
  | "delete"
  | "approve";

export type Subject =
  | Subjects<{
      User: AuthUser;
      Role: Role;
      Permission: Permission;
      Attendance: Attendance;
      PayrollRun: PayrollRun;
      Lead: Lead;
      Deal: Deal;
      Department: Department;
      Designation: Designation;
      Employee: Employee;
      LeaveApplication: LeaveApplication;
      Project: Project;
      Task: Task;
      Invoice: Invoice;
      Payment: Payment;
      Vendor: Vendor;
      PurchaseOrder: PurchaseOrder;
      Warehouse: Warehouse;
      Product: Product;
      Appraisal: Appraisal;
      EmployeeGoal: EmployeeGoal;
      HelpdeskTicket: HelpdeskTicket;
      TicketComment: TicketComment;
      TaxExemptionDeclaration: TaxExemptionDeclaration;
      Holiday: Holiday;
      CompanyEvent: CompanyEvent;
    }>
  | "all";

export type AppAbility = Ability<[Action, Subject], PrismaQuery>;

@Injectable()
export class CaslAbilityFactory {
  createForUser(user: any, permissions: any[]): AppAbility {
    const { can, cannot, build } = new AbilityBuilder<AppAbility>(
      createPrismaAbility,
    );

    // Platform Super Admins and Workspace Owners bypass all permission checks
    // We check both the new isSuperAdmin field and the globalRole enum for backward compatibility
    if (
      user.isSuperAdmin ||
      user.globalRole === "SUPERADMIN" ||
      user.workspaceRole === "OWNER"
    ) {
      can("manage", "all");
      return build();
    }

    // Map database permissions to CASL rules
    permissions.forEach((perm) => {
      const action = perm.action as Action;
      const resource = perm.resource;
      const scope = perm.scope;

      const subject = this.mapResourceToSubject(resource);

      if (!subject) return;

      if (scope === "own") {
        this.addOwnCondition(can, action, subject, user);
      } else if (scope === "department") {
        this.addDepartmentCondition(can, action, subject, user);
      } else {
        // 'all' scope or null/default
        can(action, subject);
      }
    });

    // Implicit permissions: Every employee can read their own attendance and profile
    if (user.userId) {
      can("read", "Attendance", { employee: { userId: user.userId } });
      can("create", "Attendance", { employee: { userId: user.userId } });
      can("update", "Attendance", { employee: { userId: user.userId } }); // for check-out
      can("read", "Employee", { userId: user.userId });

      // ESS implicit permissions
      can("read", "LeaveApplication", { employee: { userId: user.userId } });
      can("create", "LeaveApplication", { employee: { userId: user.userId } });
      can("update", "LeaveApplication", { employee: { userId: user.userId } }); // for cancel
      can("read", "PayrollRun"); // user can read payroll runs that contain their payslips

      can("read", "Appraisal", { employee: { userId: user.userId } });
      can("read", "HelpdeskTicket", { raisedBy: { userId: user.userId } });
      can("create", "HelpdeskTicket", { raisedBy: { userId: user.userId } });
      can("update", "HelpdeskTicket", { raisedBy: { userId: user.userId } }); // for adding comments
      can("read", "TaxExemptionDeclaration", {
        employee: { userId: user.userId },
      });
      can("create", "TaxExemptionDeclaration", {
        employee: { userId: user.userId },
      });

      can("read", "Holiday");
      can("read", "CompanyEvent");
    }

    return build();
  }

  private mapResourceToSubject(resource: string): any {
    const map: Record<string, string> = {
      users: "User",
      roles: "Role",
      permissions: "Permission",
      attendance: "Attendance",
      payroll: "PayrollRun",
      leads: "Lead",
      deals: "Deal",
      departments: "Department",
      employees: "Employee",
      designations: "Designation",
      leave: "LeaveApplication",
      leaves: "LeaveApplication",
      projects: "Project",
      tasks: "Task",
      invoices: "Invoice",
      payments: "Payment",
      vendors: "Vendor",
      "purchase-orders": "PurchaseOrder",
      inventory: "Warehouse",
      products: "Product",
      appraisals: "Appraisal",
      helpdesk: "HelpdeskTicket",
      "tax-declarations": "TaxExemptionDeclaration",
      companyevent: "CompanyEvent",
    };
    return map[resource.toLowerCase()] || null;
  }

  private addOwnCondition(
    can: any,
    action: Action,
    subject: string,
    user: any,
  ) {
    switch (subject) {
      case "Attendance":
        can(action, subject, { employee: { userId: user.userId } });
        break;
      case "Employee":
        can(action, subject, { userId: user.userId });
        break;
      case "Lead":
        can(action, subject, { leadOwnerId: user.userId });
        break;
      case "Deal":
        can(action, subject, { dealOwnerId: user.userId });
        break;
      case "Task":
        can(action, subject, {
          assignments: { some: { employee: { userId: user.userId } } },
        });
        break;
      case "LeaveApplication":
        can(action, subject, { employee: { userId: user.userId } });
        break;
      case "PayrollRun":
        can(action, subject, {
          entries: { some: { employee: { userId: user.userId } } },
        });
        break;
      case "Appraisal":
        can(action, subject, { employee: { userId: user.userId } });
        break;
      case "HelpdeskTicket":
        can(action, subject, { raisedBy: { userId: user.userId } });
        break;
      case "TaxExemptionDeclaration":
        can(action, subject, { employee: { userId: user.userId } });
        break;
      default:
        // If we don't have a specific "own" mapping, we fall back to global
        // but this should ideally be explicitly handled for security.
        can(action, subject);
    }
  }

  private addDepartmentCondition(
    can: any,
    action: Action,
    subject: string,
    user: any,
  ) {
    if (!user.department) {
      // If user has no department assigned, they can't access department-scoped resources
      return;
    }

    switch (subject) {
      case "Employee":
        can(action, subject, { department: { name: user.department } });
        break;
      case "Attendance":
        can(action, subject, {
          employee: { department: { name: user.department } },
        });
        break;
      case "Department":
        can(action, subject, { name: user.department });
        break;
      default:
        can(action, subject);
    }
  }
}
