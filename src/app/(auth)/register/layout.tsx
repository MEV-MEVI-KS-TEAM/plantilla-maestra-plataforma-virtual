import { getSiteConfig } from '@/lib/site-config'
import { esSoloLicenciaturas, getDesglosesLicenciatura } from '@/lib/licenciatura-utils'
import { DesgloseLicenciaturaProvider } from '@/components/desglose-licenciatura-provider'

/**
 * Solo-Licenciaturas (#311): el registro enseña el costo completo del plan
 * elegido (inscripción + mensualidades + titulación). La tabla efectiva solo
 * la tiene el servidor; con Sec/Prepa no se calcula nada y el registro queda
 * como siempre.
 */
export default async function RegisterLayout({ children }: { children: React.ReactNode }) {
  const planes = esSoloLicenciaturas()
    ? getDesglosesLicenciatura((await getSiteConfig()).licenciaturas)
    : []
  return <DesgloseLicenciaturaProvider value={planes}>{children}</DesgloseLicenciaturaProvider>
}
