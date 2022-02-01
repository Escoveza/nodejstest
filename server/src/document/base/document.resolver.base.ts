import * as common from "@nestjs/common";
import * as graphql from "@nestjs/graphql";
import * as apollo from "apollo-server-express";
import * as nestAccessControl from "nest-access-control";
import { GqlDefaultAuthGuard } from "../../auth/gqlDefaultAuth.guard";
import * as gqlACGuard from "../../auth/gqlAC.guard";
import * as gqlUserRoles from "../../auth/gqlUserRoles.decorator";
import * as abacUtil from "../../auth/abac.util";
import { isRecordNotFoundError } from "../../prisma.util";
import { MetaQueryPayload } from "../../util/MetaQueryPayload";
import { CreateDocumentArgs } from "./CreateDocumentArgs";
import { UpdateDocumentArgs } from "./UpdateDocumentArgs";
import { DeleteDocumentArgs } from "./DeleteDocumentArgs";
import { DocumentFindManyArgs } from "./DocumentFindManyArgs";
import { DocumentFindUniqueArgs } from "./DocumentFindUniqueArgs";
import { Document } from "./Document";
import { DocumentService } from "../document.service";

@graphql.Resolver(() => Document)
@common.UseGuards(GqlDefaultAuthGuard, gqlACGuard.GqlACGuard)
export class DocumentResolverBase {
  constructor(
    protected readonly service: DocumentService,
    protected readonly rolesBuilder: nestAccessControl.RolesBuilder
  ) {}

  @graphql.Query(() => MetaQueryPayload)
  @nestAccessControl.UseRoles({
    resource: "Document",
    action: "read",
    possession: "any",
  })
  async _documentsMeta(
    @graphql.Args() args: DocumentFindManyArgs
  ): Promise<MetaQueryPayload> {
    const results = await this.service.count({
      ...args,
      skip: undefined,
      take: undefined,
    });
    return {
      count: results,
    };
  }

  @graphql.Query(() => [Document])
  @nestAccessControl.UseRoles({
    resource: "Document",
    action: "read",
    possession: "any",
  })
  async documents(
    @graphql.Args() args: DocumentFindManyArgs,
    @gqlUserRoles.UserRoles() userRoles: string[]
  ): Promise<Document[]> {
    const permission = this.rolesBuilder.permission({
      role: userRoles,
      action: "read",
      possession: "any",
      resource: "Document",
    });
    const results = await this.service.findMany(args);
    return results.map((result) => permission.filter(result));
  }

  @graphql.Query(() => Document, { nullable: true })
  @nestAccessControl.UseRoles({
    resource: "Document",
    action: "read",
    possession: "own",
  })
  async document(
    @graphql.Args() args: DocumentFindUniqueArgs,
    @gqlUserRoles.UserRoles() userRoles: string[]
  ): Promise<Document | null> {
    const permission = this.rolesBuilder.permission({
      role: userRoles,
      action: "read",
      possession: "own",
      resource: "Document",
    });
    const result = await this.service.findOne(args);
    if (result === null) {
      return null;
    }
    return permission.filter(result);
  }

  @graphql.Mutation(() => Document)
  @nestAccessControl.UseRoles({
    resource: "Document",
    action: "create",
    possession: "any",
  })
  async createDocument(
    @graphql.Args() args: CreateDocumentArgs,
    @gqlUserRoles.UserRoles() userRoles: string[]
  ): Promise<Document> {
    const permission = this.rolesBuilder.permission({
      role: userRoles,
      action: "create",
      possession: "any",
      resource: "Document",
    });
    const invalidAttributes = abacUtil.getInvalidAttributes(
      permission,
      args.data
    );
    if (invalidAttributes.length) {
      const properties = invalidAttributes
        .map((attribute: string) => JSON.stringify(attribute))
        .join(", ");
      const roles = userRoles
        .map((role: string) => JSON.stringify(role))
        .join(",");
      throw new apollo.ApolloError(
        `providing the properties: ${properties} on ${"Document"} creation is forbidden for roles: ${roles}`
      );
    }
    // @ts-ignore
    return await this.service.create({
      ...args,
      data: args.data,
    });
  }

  @graphql.Mutation(() => Document)
  @nestAccessControl.UseRoles({
    resource: "Document",
    action: "update",
    possession: "any",
  })
  async updateDocument(
    @graphql.Args() args: UpdateDocumentArgs,
    @gqlUserRoles.UserRoles() userRoles: string[]
  ): Promise<Document | null> {
    const permission = this.rolesBuilder.permission({
      role: userRoles,
      action: "update",
      possession: "any",
      resource: "Document",
    });
    const invalidAttributes = abacUtil.getInvalidAttributes(
      permission,
      args.data
    );
    if (invalidAttributes.length) {
      const properties = invalidAttributes
        .map((attribute: string) => JSON.stringify(attribute))
        .join(", ");
      const roles = userRoles
        .map((role: string) => JSON.stringify(role))
        .join(",");
      throw new apollo.ApolloError(
        `providing the properties: ${properties} on ${"Document"} update is forbidden for roles: ${roles}`
      );
    }
    try {
      // @ts-ignore
      return await this.service.update({
        ...args,
        data: args.data,
      });
    } catch (error) {
      if (isRecordNotFoundError(error)) {
        throw new apollo.ApolloError(
          `No resource was found for ${JSON.stringify(args.where)}`
        );
      }
      throw error;
    }
  }

  @graphql.Mutation(() => Document)
  @nestAccessControl.UseRoles({
    resource: "Document",
    action: "delete",
    possession: "any",
  })
  async deleteDocument(
    @graphql.Args() args: DeleteDocumentArgs
  ): Promise<Document | null> {
    try {
      // @ts-ignore
      return await this.service.delete(args);
    } catch (error) {
      if (isRecordNotFoundError(error)) {
        throw new apollo.ApolloError(
          `No resource was found for ${JSON.stringify(args.where)}`
        );
      }
      throw error;
    }
  }
}
