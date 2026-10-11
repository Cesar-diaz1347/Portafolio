import { Chips } from '../../../components/Chips/Chips'
import { STACK_PRINCIPAL } from '../../../data/habilidades'
import { cx } from '../../../lib/cx'
import styles from '../Tarjetas.module.css'

export function TarjetaStack() {
  return (
    <>
      <p className={cx(styles.rotulo, styles.conAsa)}>Stack principal</p>
      <Chips items={STACK_PRINCIPAL} etiqueta="Stack principal" acento />
    </>
  )
}
