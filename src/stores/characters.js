import { defineStore } from 'pinia'
import { ref } from 'vue'
import { db } from '@/firebase'
import { 
  collection, 
  addDoc, 
  updateDoc,
  deleteDoc,
  doc, 
  query, 
  where,
  onSnapshot,
  serverTimestamp 
} from 'firebase/firestore'

export const useCharactersStore = defineStore('characters', () => {
  const characters = ref([])
  const loading = ref(false)
  const error = ref(null)
  
  let unsubscribe = null

  // Данные о народах
  const races = {
    human: {
      name: 'Человек',
      ability: 'Излишняя осторожность',
      description: 'С шансом 2-из-6 люди автоматически замечают скрытые ловушки в <b>ярко освещённой</b> области радиусом 30\'. Кроме того, они получают на 10% больше ОО.'
    },
    gmur: {
      name: 'Гмур',
      ability: 'Камнерождённый',
      description: 'Гмуры получают 1 дополнительное ремесло: <i>шахтёр</i> или <i>кузнец</i>. Кроме того, они совершают бросок 2 костей для определения ОЗ, выбирая наибольшее значение за каждый УР.'
    },
    div: {
      name: 'Дивь',
      ability: 'Мистическая память',
      description: 'С шансом 2-из-6 дивьи автоматически замечают скрытые магией проходы и секретные двери в <b>ярко освещённой</b> области радиусом 30\'. Если при создании персонажа у него есть очки РЗМ, игрок может выбирать книги заклинаний, вместо того чтобы определять их случайным образом.'
    }
  }

  // Способности характеристик
  const statAbilities = {
    stk: {
      5: {
        name: 'Шквал ударов',
        description: 'ПИ может совершить дополнительную атаку в свой ход частью одного действия. Атаки должны быть нанесены <b>одним и тем же оружием</b> (<i>исключением является парное оружие и безоружные атаки</i>). Не действует со скрытой или разрушительной атакой.'
      },
      10: {
        name: 'Стиснуть зубы',
        description: 'ПИ может повысить свой болевой порог на 6 раундов, получая в 2 раза меньше урона от немагических атак и огня. В этом состоянии он не может говорить, а все эффекты его заклинаний прекращаются. Если ПИ использует эту способность повторно в течение одного дня, он получит 1к4 ран за каждое применение.'
      }
    },
    lvk: {
      5: {
        name: 'Ловкий удар',
        description: 'При промахе <b>оружием ближнего боя</b> ПИ может продолжить атаку ловким ударом. Это позволяет провести одну дополнительную атаку в свой ход <b>тем же оружием</b>. При выпадении 1 во время броска на попадание оружие по-прежнему ломается без возможности переброса. Базовая СКР увеличивается на 5\'.'
      },
      10: {
        name: 'Подлый приём',
        description: 'Если у ПИ есть преимущество на атаку оружием ближнего или дальнего боя, то он может отказаться от него, чтобы увеличить количество костей урона оружия на одну. Не действует со скрытой или разрушительной атакой. Базовая СКР увеличивается ещё на 5\'.'
      }
    },
    rzm: {
      5: [
        {
          name: 'Проявление воли',
          description: 'ПИ может действием защитить себя от 1к6 ближайших недружественных существ противоположного МВ на 1 ход. Поражённые существа должны совершить проверку РЗМ (<i>сложность 11 + РЗМ персонажа</i>) с бонусом, равным их УР. При провале цель вынуждена держаться на расстоянии 10\' от ПИ (если это возможно), не причинять ему вреда и не вступать с ним в контакт, если он сам её не спровоцирует. Можно использовать РЗМ раз в день. ПИ должен иметь МВ <b>порядок</b> или <b>хаос</b>, чтобы получить и использовать это умение. В случае смены МВ на <b>баланс</b>, особенность изменяется на <b>проявление баланса</b>.'
        },
        {
          name: 'Проявление баланса',
          description: 'ПИ связывает свою душу с малым духом-фамильяром. Всё, на что способен дух – исцелять 1к8 ОЗ согласного существа или 1 рану, нанося владельцу 1 рану за каждое исцеление. ПИ должен иметь МВ <b>баланс</b>, чтобы получить и использовать это умение. В случае смены МВ на <b>порядок</b> или <b>хаос</b> особенность изменяется на <b>проявление воли</b>.'
        }
      ],
      10: {
        name: 'Магическое исследование',
        description: 'ПИ может создавать книги заклинаний из свитков. Для этого требуется пустая книга, а также одна неделя (или 28 вахт) и 500 монет за каждый круг заклинания. Если ПИ занимается переписыванием свитка не в безопасном месте, то он должен совершать проверку РЗМ (<i>сложность 11 + круг заклинания</i>) каждую вахту, чтобы определить, продвинулся ли он в создании книги или нет. При провале считается, что вахта потрачена впустую. В конце всего исследования существует 1-из-6 шанс неудачи – в таком случае и свиток и материалы уничтожаются.'
      }
    },
    har: {
      5: {
        name: 'Лидерство',
        description: 'ХАР раз в день ПИ может добавлять 1к4 к своему следующему броску атаки или проверке характеристики. Этот бонус также можно предоставить союзнику в пределах 40\', потратив действие в свой ход.'
      },
      10: {
        name: 'Воодушевление',
        description: 'Все наёмники ПИ получают +2 к БД (<i>при максимуме в 12</i>). Раз в день ПИ может автоматически преуспеть в любой проверке против страха, очарования, усыпления и подобных эффектах, влияющих на разум, или помочь союзнику в пределах 20\' автоматически преодолеть этот эффект.'
      }
    }
  }

  // Создать персонажа
  async function createCharacter(campaignId, characterData, userId) {
    loading.value = true
    error.value = null
    
    try {
      const docRef = await addDoc(collection(db, 'campaigns', campaignId, 'characters'), {
        ...characterData,
        ownerId: userId,
        createdAt: serverTimestamp()
      })
      
      return { id: docRef.id, ...characterData }
    } catch (e) {
      error.value = e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  // Обновить персонажа (только владелец)
  async function updateCharacter(campaignId, characterId, updates, userId) {
    loading.value = true
    error.value = null
    
    try {
      // Проверяем что персонаж принадлежит пользователю
      const character = characters.value.find(c => c.id === characterId)
      if (!character || character.ownerId !== userId) {
        throw new Error('Вы не можете редактировать этого персонажа')
      }
      
      await updateDoc(doc(db, 'campaigns', campaignId, 'characters', characterId), {
        ...updates,
        updatedAt: serverTimestamp()
      })
    } catch (e) {
      error.value = e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  // Удалить персонажа
  async function deleteCharacter(campaignId, characterId, userId) {
    loading.value = true
    error.value = null
    
    try {
      const character = characters.value.find(c => c.id === characterId)
      if (!character || character.ownerId !== userId) {
        throw new Error('Вы не можете удалить этого персонажа')
      }
      
      await deleteDoc(doc(db, 'campaigns', campaignId, 'characters', characterId))
    } catch (e) {
      error.value = e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  // Подписка на персонажей кампании
  function subscribeToCharacters(campaignId) {
    if (unsubscribe) {
      unsubscribe()
    }
    
    const q = query(collection(db, 'campaigns', campaignId, 'characters'))
    
    unsubscribe = onSnapshot(q, (snapshot) => {
      characters.value = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
    }, (e) => {
      error.value = e.message
    })
  }

  // Отписка
  function unsubscribeFromCharacters() {
    if (unsubscribe) {
      unsubscribe()
      unsubscribe = null
    }
    characters.value = []
  }

  // Получить персонажей пользователя
  function getMyCharacters(userId) {
    return characters.value.filter(c => c.ownerId === userId)
  }

  return {
    characters,
    loading,
    error,
    races,
    statAbilities,
    createCharacter,
    updateCharacter,
    deleteCharacter,
    subscribeToCharacters,
    unsubscribeFromCharacters,
    getMyCharacters
  }
})


