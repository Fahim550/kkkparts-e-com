import { UomRepository } from "../../infrastructure/repositories/uom.repository";
import { UOMSchema } from "../../domain/schemas";
import { UOM, CreateUOMDTO, UpdateUOMDTO } from "../../domain/types";

export class UomService {
  static async getAllUOMs(): Promise<UOM[]> {
    return await UomRepository.getAll();
  }

  static async getUOMById(id: string): Promise<UOM | null> {
    return await UomRepository.getById(id);
  }

  static async createUOM(payload: CreateUOMDTO): Promise<UOM> {
    const validated = UOMSchema.parse(payload);
    return await UomRepository.create(validated as CreateUOMDTO);
  }

  static async updateUOM(payload: UpdateUOMDTO): Promise<UOM> {
    const validated = UOMSchema.partial().parse(payload);
    return await UomRepository.update({
      ...validated,
      id: payload.id,
    } as UpdateUOMDTO);
  }

  static async deleteUOM(id: string): Promise<void> {
    return await UomRepository.delete(id);
  }
}
