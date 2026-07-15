import { AttributeSchema, AttributeValueSchema } from "../../domain/schemas";
import {
  Attribute,
  AttributeValue,
  AttributeWithValues,
  CreateAttributeDTO,
  CreateAttributeValueDTO,
  UpdateAttributeDTO,
  UpdateAttributeValueDTO,
} from "../../domain/types";
import { AttributeRepository } from "../../infrastructure/repositories/attribute.repository";

export class AttributeService {
  static async getAllAttributes(): Promise<Attribute[]> {
    return await AttributeRepository.getAll();
  }

  static async getAllAttributesWithValues(): Promise<AttributeWithValues[]> {
    return await AttributeRepository.getAllWithValues();
  }

  static async getAttributeById(id: string): Promise<Attribute | null> {
    return await AttributeRepository.getById(id);
  }

  static async createAttribute(
    payload: CreateAttributeDTO,
  ): Promise<Attribute> {
    const validated = AttributeSchema.parse(payload);
    return await AttributeRepository.create(validated as CreateAttributeDTO);
  }

  static async updateAttribute(
    payload: UpdateAttributeDTO,
  ): Promise<Attribute> {
    const validated = AttributeSchema.partial().parse(payload);
    return await AttributeRepository.update({
      ...validated,
      id: payload.id,
    } as UpdateAttributeDTO);
  }

  static async deleteAttribute(id: string): Promise<void> {
    return await AttributeRepository.delete(id);
  }

  // --- Values ---

  static async createAttributeValue(
    payload: CreateAttributeValueDTO,
  ): Promise<AttributeValue> {
    const validated = AttributeValueSchema.parse(payload);
    return await AttributeRepository.createValue(
      validated as CreateAttributeValueDTO,
    );
  }

  static async updateAttributeValue(
    payload: UpdateAttributeValueDTO,
  ): Promise<AttributeValue> {
    const validated = AttributeValueSchema.partial().parse(payload);
    return await AttributeRepository.updateValue({
      ...validated,
      id: payload.id,
    } as UpdateAttributeValueDTO);
  }

  static async deleteAttributeValue(id: string): Promise<void> {
    return await AttributeRepository.deleteValue(id);
  }
}
