import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ClinicalAdmissionGuard } from '../components/guards/ClinicalAdmissionGuard';

describe('ClinicalAdmissionGuard Component', () => {
  const mockChildText = 'Contenido Clínico Protegido';
  const ProtectedComponent = () => <div>{mockChildText}</div>;

  beforeEach(() => {
    vi.unstubAllEnvs();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe('a) Bloqueo cuando citaEstado es CONFIRMADA o undefined', () => {
    it('debe bloquear la atención médica cuando citaEstado es CONFIRMADA', () => {
      render(
        <ClinicalAdmissionGuard citaEstado="CONFIRMADA">
          <ProtectedComponent />
        </ClinicalAdmissionGuard>
      );

      expect(screen.getByText('Atención Médica Bloqueada')).toBeInTheDocument();
      expect(screen.getByText(/CONFIRMADA/i)).toBeInTheDocument();
      expect(screen.queryByText(mockChildText)).not.toBeInTheDocument();
    });

    it('debe bloquear la atención médica cuando citaEstado es undefined', () => {
      render(
        <ClinicalAdmissionGuard citaEstado={undefined}>
          <ProtectedComponent />
        </ClinicalAdmissionGuard>
      );

      expect(screen.getByText('Atención Médica Bloqueada')).toBeInTheDocument();
      expect(screen.queryByText(mockChildText)).not.toBeInTheDocument();
    });
  });

  describe('b) Renderizado de los hijos cuando citaEstado es EN_SALA o ADMITIDO', () => {
    it('debe permitir el acceso y renderizar los hijos cuando citaEstado es EN_SALA', () => {
      render(
        <ClinicalAdmissionGuard citaEstado="EN_SALA">
          <ProtectedComponent />
        </ClinicalAdmissionGuard>
      );

      expect(screen.getByText(mockChildText)).toBeInTheDocument();
      expect(screen.queryByText('Atención Médica Bloqueada')).not.toBeInTheDocument();
    });

    it('debe permitir el acceso y renderizar los hijos cuando citaEstado es ADMITIDO', () => {
      render(
        <ClinicalAdmissionGuard citaEstado="ADMITIDO">
          <ProtectedComponent />
        </ClinicalAdmissionGuard>
      );

      expect(screen.getByText(mockChildText)).toBeInTheDocument();
      expect(screen.queryByText('Atención Médica Bloqueada')).not.toBeInTheDocument();
    });
  });

  describe('c) Renderizado de los hijos cuando VITE_ENABLE_HC_DEV_BYPASS está activo', () => {
    it('debe permitir el acceso cuando VITE_ENABLE_HC_DEV_BYPASS es true incluso si citaEstado es CONFIRMADA', () => {
      vi.stubEnv('VITE_ENABLE_HC_DEV_BYPASS', 'true');

      render(
        <ClinicalAdmissionGuard citaEstado="CONFIRMADA">
          <ProtectedComponent />
        </ClinicalAdmissionGuard>
      );

      expect(screen.getByText(mockChildText)).toBeInTheDocument();
      expect(screen.queryByText('Atención Médica Bloqueada')).not.toBeInTheDocument();
    });

    it('debe permitir el acceso cuando VITE_ENABLE_HC_DEV_BYPASS es true incluso si citaEstado es undefined', () => {
      vi.stubEnv('VITE_ENABLE_HC_DEV_BYPASS', 'true');

      render(
        <ClinicalAdmissionGuard citaEstado={undefined}>
          <ProtectedComponent />
        </ClinicalAdmissionGuard>
      );

      expect(screen.getByText(mockChildText)).toBeInTheDocument();
      expect(screen.queryByText('Atención Médica Bloqueada')).not.toBeInTheDocument();
    });
  });
});
