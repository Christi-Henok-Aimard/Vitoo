import type { Request, Response } from 'express';
import { prisma } from '../lib/db.js';

export const getVehiclesController = async (request: Request, response: Response) => {
  const companyId = request.authUser?.id;
  if (!companyId) return response.status(401).json({ message: 'Non authentifié.' });

  const vehicles = await prisma.vehicle.findMany({
    where: { companyId },
    orderBy: { createdAt: 'desc' },
  });

  return response.json({
    vehicles: vehicles.map((v) => ({
      id: v.id,
      companyId: v.companyId,
      plate: v.plateNumber,
      brand: v.brand || '',
      model: v.model,
      capacity: v.capacity,
      color: v.color || '',
      photo: v.photo || undefined,
      status: v.isActive ? 'available' : 'maintenance',
      createdAt: v.createdAt.toISOString(),
    })),
  });
};

export const addVehicleController = async (request: Request, response: Response) => {
  const companyId = request.authUser?.id;
  if (!companyId) return response.status(401).json({ message: 'Non authentifié.' });

  const { plate, brand, model, capacity, color, photo } = request.body as {
    plate?: string;
    brand?: string;
    model?: string;
    capacity?: number;
    color?: string;
    photo?: string;
  };

  if (!plate?.trim() || !brand?.trim() || !model?.trim() || !capacity) {
    return response.status(400).json({ message: 'La plaque, la marque, le modèle et la capacité sont obligatoires.' });
  }

  const vehicle = await prisma.vehicle.create({
    data: {
      companyId,
      plateNumber: plate.trim(),
      brand: brand.trim(),
      model: model.trim(),
      capacity: Number(capacity),
      color: color?.trim() || null,
      photo: photo || null,
      isActive: true,
    },
  });

  return response.status(201).json({
    vehicle: {
      id: vehicle.id,
      companyId: vehicle.companyId,
      plate: vehicle.plateNumber,
      brand: vehicle.brand || '',
      model: vehicle.model,
      capacity: vehicle.capacity,
      color: vehicle.color || '',
      photo: vehicle.photo || undefined,
      status: 'available',
      createdAt: vehicle.createdAt.toISOString(),
    },
  });
};

export const updateVehicleController = async (request: Request, response: Response) => {
  const companyId = request.authUser?.id;
  if (!companyId) return response.status(401).json({ message: 'Non authentifié.' });

  const id = String(request.params.id);
  const vehicle = await prisma.vehicle.findFirst({
    where: { id, companyId },
  });

  if (!vehicle) return response.status(404).json({ message: 'Véhicule introuvable.' });

  const { plate, brand, model, capacity, color, photo, status } = request.body as {
    plate?: string;
    brand?: string;
    model?: string;
    capacity?: number;
    color?: string;
    photo?: string;
    status?: string;
  };

  const updateData: Record<string, unknown> = {};
  if (plate !== undefined) updateData.plateNumber = plate;
  if (brand !== undefined) updateData.brand = brand;
  if (model !== undefined) updateData.model = model;
  if (capacity !== undefined) updateData.capacity = Number(capacity);
  if (color !== undefined) updateData.color = color;
  if (photo !== undefined) updateData.photo = photo;
  if (status !== undefined) updateData.isActive = status !== 'maintenance';

  const updated = await prisma.vehicle.update({
    where: { id: vehicle.id },
    data: updateData,
  });

  return response.json({
    vehicle: {
      id: updated.id,
      companyId: updated.companyId,
      plate: updated.plateNumber,
      brand: updated.brand || '',
      model: updated.model,
      capacity: updated.capacity,
      color: updated.color || '',
      photo: updated.photo || undefined,
      status: updated.isActive ? 'available' : 'maintenance',
      createdAt: updated.createdAt.toISOString(),
    },
  });
};

export const deleteVehicleController = async (request: Request, response: Response) => {
  const companyId = request.authUser?.id;
  if (!companyId) return response.status(401).json({ message: 'Non authentifié.' });

  const id = String(request.params.id);
  const vehicle = await prisma.vehicle.findFirst({
    where: { id, companyId },
  });

  if (!vehicle) return response.status(404).json({ message: 'Véhicule introuvable.' });

  await prisma.vehicle.delete({ where: { id: vehicle.id } });
  return response.json({ message: 'Véhicule supprimé.' });
};
