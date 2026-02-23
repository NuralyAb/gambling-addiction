import Card from "@/components/ui/Card";

const RESOURCES = [
  {
    category: "Самопомощь",
    items: [
      { title: "Gamblers Anonymous (GA)", description: "Международное сообщество взаимопомощи для людей с игровой зависимостью" },
      { title: "Техника HALT", description: "Проверяйте себя: Hungry, Angry, Lonely, Tired — частые триггеры срыва" },
      { title: "Дневник импульсов", description: "Записывайте каждый раз, когда хотите играть — что спровоцировало, что помогло удержаться" },
    ],
  },
  {
    category: "Для близких",
    items: [
      { title: "Gam-Anon", description: "Группы поддержки для семей и друзей людей с игровой зависимостью" },
      { title: "Как говорить о зависимости", description: "Без обвинений, с эмпатией. Используйте 'я-высказывания' вместо 'ты-обвинений'" },
    ],
  },
  {
    category: "Финансовая защита",
    items: [
      { title: "Самоисключение", description: "Подайте заявку на самоисключение из онлайн-казино и букмекерских контор" },
      { title: "Ограничение доступа к деньгам", description: "Передайте контроль над финансами доверенному лицу на период восстановления" },
      { title: "Блокировка транзакций", description: "Попросите банк заблокировать переводы на игровые платформы" },
    ],
  },
];

export default function ResourcesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Ресурсы</h1>
        <p className="text-slate-400 mt-1">Полезные материалы и рекомендации</p>
      </div>

      {RESOURCES.map((section) => (
        <div key={section.category}>
          <h2 className="text-lg font-semibold text-white mb-3">{section.category}</h2>
          <div className="space-y-3">
            {section.items.map((item) => (
              <Card key={item.title}>
                <h3 className="text-white font-medium mb-1">{item.title}</h3>
                <p className="text-sm text-slate-400">{item.description}</p>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
