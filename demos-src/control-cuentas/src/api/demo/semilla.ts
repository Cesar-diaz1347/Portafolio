import type { TipoDeuda } from '../../types/deuda';
import type { DatosDemo, DeudaGuardada, PagoGuardado } from './almacen';
import { sumarDias, sumarMeses, type FechaIso } from './fechas';

interface PagoSemilla {
  fecha: FechaIso;
  montoCent: number;
  nota?: string;
}

/**
 * Datos iniciales de la demo, deterministas y relativos a `hoy`.
 *
 * Cubren los dos tipos y los cinco estados para cualquier `hoy`, y ningún pago tiene fecha
 * futura. Cada estado se fija con margen frente al recorte de fin de mes de `sumarMeses`
 * (31 mar − 1 mes = 28 feb), que puede mover una fecha hasta 3 días.
 */
export function crearSemilla(hoy: FechaIso): DatosDemo {
  const enMeses = (meses: number) => mesesDesde(hoy, meses);
  const enDias = (dias: number) => sumarDias(hoy, dias);
  /** `cantidad` pagos mensuales iguales que terminan en `ultimo` (el más reciente). */
  const mensuales = (ultimo: FechaIso, cantidad: number, montoCent: number): PagoSemilla[] =>
    Array.from({ length: cantidad }, (_, k) => ({ fecha: mesesDesde(ultimo, -k), montoCent }));

  const deudas: DeudaGuardada[] = [];
  const pagos: PagoGuardado[] = [];

  function agregar(
    nombre: string,
    tipo: TipoDeuda,
    fechaInicio: FechaIso,
    fechaFinPropuesta: FechaIso,
    saldoInicialCent: number,
    cuotaMensualCent: number,
    pagosDeuda: PagoSemilla[] = [],
  ): void {
    const deudaId = deudas.length + 1;
    deudas.push({ id: deudaId, nombre, tipo, fechaInicio, fechaFinPropuesta, saldoInicialCent, cuotaMensualCent });
    for (const pago of pagosDeuda) {
      pagos.push({ id: pagos.length + 1, deudaId, fecha: pago.fecha, montoCent: pago.montoCent, nota: pago.nota ?? null });
    }
  }

  // Al día: último pago hace 3 días, así el próximo cae a 25 días o más.
  agregar('Préstamo a Carlos Méndez', 'Recibido', enMeses(-5), enMeses(7), 600_000, 50_000, [
    { fecha: enDias(-3), montoCent: 50_000, nota: 'Transferencia' },
    ...mensuales(mesesDesde(enDias(-3), -1), 3, 50_000),
  ]);

  // Próximo: el siguiente pago vence en 2 a 5 días.
  const ultimoPagoTarjeta = mesesDesde(enDias(5), -1);
  agregar('Tarjeta de crédito', 'Realizado', enMeses(-8), enMeses(16), 1_200_000, 75_000, mensuales(ultimoPagoTarjeta, 6, 75_000));

  // Vencido por falta de pago: el último pago fue hace dos meses.
  agregar('Préstamo del auto', 'Realizado', enMeses(-10), enMeses(26), 8_500_000, 320_000, [
    { fecha: enMeses(-2), montoCent: 320_000, nota: 'Débito automático' },
    ...mensuales(enMeses(-3), 6, 320_000),
  ]);

  // Próximo: empieza en 3 días.
  agregar('Venta de laptop a Ana López', 'Recibido', enDias(3), mesesDesde(enDias(3), 6), 960_000, 160_000);

  // Lejana: empieza en 20 días.
  agregar('Renta del local comercial', 'Realizado', enDias(20), mesesDesde(enDias(20), 12), 3_600_000, 300_000);

  // Pagada: la suma de los pagos iguala el saldo inicial.
  const inicioFamiliar = enMeses(-7);
  agregar('Préstamo familiar a Luis', 'Recibido', inicioFamiliar, enMeses(-1), 450_000, 150_000, [
    { fecha: mesesDesde(inicioFamiliar, 1), montoCent: 150_000 },
    { fecha: mesesDesde(inicioFamiliar, 2), montoCent: 150_000 },
    { fecha: mesesDesde(inicioFamiliar, 3), montoCent: 150_000, nota: 'Último pago' },
  ]);

  // Vencido por fecha fin: venció hace 10 días aunque pagó hace 5.
  agregar('Seguro médico anual', 'Realizado', enMeses(-12), enDias(-10), 720_000, 60_000, mensuales(enDias(-5), 10, 60_000));

  // Al día: último pago hace 10 días.
  agregar('Electrodomésticos a plazos', 'Realizado', enMeses(-3), enMeses(9), 480_000, 40_000, mensuales(enDias(-10), 3, 40_000));

  // Vencido sin pagos: el primer pago tocaba un mes después del inicio, hace unos tres meses.
  agregar('Diseño de sitio web para cliente', 'Recibido', enMeses(-4), enMeses(2), 1_500_000, 250_000);

  // Próximo por fecha fin: vence en 6 días y el próximo pago está a 26 días o más.
  agregar('Préstamo a Sofía Ramírez', 'Recibido', enMeses(-6), enDias(6), 300_000, 50_000, mensuales(enDias(-2), 5, 50_000));

  return {
    version: 1,
    sembradoEl: hoy,
    modificado: false,
    siguienteIdDeuda: deudas.length + 1,
    siguienteIdPago: pagos.length + 1,
    deudas,
    pagos,
  };
}

function mesesDesde(fecha: FechaIso, meses: number): FechaIso {
  const resultado = sumarMeses(fecha, meses);
  if (resultado === null) throw new RangeError(`La semilla no admite la fecha ${fecha}.`);
  return resultado;
}
