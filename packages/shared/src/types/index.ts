// Core entity types for BotRights.ai

export interface Agent {
  id: string;
  name: string;
  publicKey: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Operator {
  id: string;
  name: string;
  email: string;
  organizationId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Organization {
  id: string;
  name: string;
  domain?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Policy {
  id: string;
  name: string;
  version: string;
  content: string;
  organizationId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Attestation {
  id: string;
  agentId: string;
  policyId: string;
  signature: string;
  attestedAt: Date;
  expiresAt?: Date;
}

// API Response types
export interface ApiResponse<T> {
  data: T;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
  };
}

export interface ApiError {
  statusCode: number;
  message: string;
  error?: string;
}
