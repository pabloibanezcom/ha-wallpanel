import { LightCard } from '../components/LightCard';

const GROUPS = [
  {
    label: 'Salón',
    lights: [
      { id: 'light.salon', name: 'Luz principal' },
      { id: 'light.tira_led_techo', name: 'LED Techo' },
      { id: 'light.tira_led_mueble_tv', name: 'LED Mueble TV' },
    ],
  },
  {
    label: 'Cocina',
    lights: [
      { id: 'light.cocina', name: 'Luz cocina' },
      { id: 'light.cocina_led', name: 'LED cocina' },
    ],
  },
  {
    label: 'Dormitorio',
    lights: [
      { id: 'light.dormitorio_entrada_a', name: 'Luz entrada' },
      { id: 'light.vestidor', name: 'Vestidor' },
    ],
  },
  {
    label: 'Estudio',
    lights: [
      { id: 'light.estudio', name: 'Luz estudio' },
      { id: 'light.tira_led_estudio', name: 'Tira LED' },
      { id: 'light.armario_estudio', name: 'Armario' },
    ],
  },
  {
    label: 'Niños',
    lights: [{ id: 'light.habitacion_andres', name: 'Habitación' }],
  },
  {
    label: 'Exterior',
    lights: [
      { id: 'light.exterior_salon', name: 'Salón ext.' },
      { id: 'light.exterior_entrada', name: 'Entrada' },
      { id: 'light.exterior_jardin', name: 'Jardín' },
      { id: 'light.exterior_lateral', name: 'Lateral' },
    ],
  },
];

export function Luces() {
  return (
    <div className="space-y-4">
      {GROUPS.map((group) => (
        <div key={group.label}>
          <h2 className="text-white/40 text-xs font-medium uppercase tracking-wider mb-2 px-1">
            {group.label}
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {group.lights.map((light) => (
              <LightCard key={light.id} entityId={light.id} name={light.name} showBrightness />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
