import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useSpellsStore = defineStore('spells', () => {
  const spells = ref([])
  const spellMap = ref(new Map())
  const loading = ref(false)
  const loaded = ref(false)
  const error = ref(null)

  async function fetchSpells() {
    if (loaded.value || loading.value) return

    loading.value = true
    error.value = null

    const key = import.meta.env.VITE_GS_API_KEY
    const id = import.meta.env.VITE_GS_ST_CMS_ID
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${id}/values/spells?key=${key}`

    try {
      const response = await fetch(url)
      const data = await response.json()

      if (!data.values) {
        error.value = 'Нет данных'
        return
      }

      const [headers, ...rows] = data.values

      const nameIdx = headers.indexOf('name')
      const descIdx = headers.indexOf('description')

      if (nameIdx === -1 || descIdx === -1) {
        error.value = 'Не найдены столбцы name/description'
        return
      }

      const parsed = rows
        .filter(row => row[nameIdx])
        .map(row => ({
          name: (row[nameIdx] || '').trim(),
          description: (row[descIdx] || '').trim().replace(/\n/g, '<br>')
        }))

      spells.value = parsed

      const map = new Map()
      parsed.forEach(spell => {
        map.set(spell.name.toLowerCase(), spell)
      })
      spellMap.value = map

      loaded.value = true
    } catch (e) {
      console.error('Ошибка загрузки заклинаний:', e)
      error.value = e.message
    } finally {
      loading.value = false
    }
  }

  function findSpell(name) {
    if (!name || !name.trim()) return null
    return spellMap.value.get(name.trim().toLowerCase()) || null
  }

  return {
    spells,
    loading,
    loaded,
    error,
    fetchSpells,
    findSpell
  }
})
