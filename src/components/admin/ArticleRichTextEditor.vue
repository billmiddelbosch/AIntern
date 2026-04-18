<script setup lang="ts">
import { watch, onBeforeUnmount } from 'vue'
import { useEditor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'

const props = defineProps<{
  modelValue: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const editor = useEditor({
  extensions: [StarterKit, Link.configure({ openOnClick: false })],
  content: props.modelValue,
  onUpdate: ({ editor: e }) => {
    emit('update:modelValue', e.getHTML())
  },
})

watch(
  () => props.modelValue,
  (val) => {
    if (editor.value && editor.value.getHTML() !== val) {
      editor.value.commands.setContent(val, false)
    }
  },
)

onBeforeUnmount(() => {
  editor.value?.destroy()
})
</script>

<template>
  <div class="border border-slate-200 rounded-xl overflow-hidden bg-white">
    <div v-if="editor" class="flex flex-wrap items-center gap-1 px-3 py-2 border-b border-slate-200 bg-slate-50">
      <button
        type="button"
        class="px-2 py-1 text-xs font-bold rounded hover:bg-slate-200 transition-colors"
        :class="{ 'bg-slate-200': editor.isActive('bold') }"
        @click="editor.chain().focus().toggleBold().run()"
      >B</button>
      <button
        type="button"
        class="px-2 py-1 text-xs italic rounded hover:bg-slate-200 transition-colors"
        :class="{ 'bg-slate-200': editor.isActive('italic') }"
        @click="editor.chain().focus().toggleItalic().run()"
      >I</button>
      <span class="w-px h-4 bg-slate-300 mx-1" />
      <button
        type="button"
        class="px-2 py-1 text-xs font-semibold rounded hover:bg-slate-200 transition-colors"
        :class="{ 'bg-slate-200': editor.isActive('heading', { level: 2 }) }"
        @click="editor.chain().focus().toggleHeading({ level: 2 }).run()"
      >H2</button>
      <button
        type="button"
        class="px-2 py-1 text-xs font-semibold rounded hover:bg-slate-200 transition-colors"
        :class="{ 'bg-slate-200': editor.isActive('heading', { level: 3 }) }"
        @click="editor.chain().focus().toggleHeading({ level: 3 }).run()"
      >H3</button>
      <span class="w-px h-4 bg-slate-300 mx-1" />
      <button
        type="button"
        class="px-2 py-1 text-xs rounded hover:bg-slate-200 transition-colors"
        :class="{ 'bg-slate-200': editor.isActive('bulletList') }"
        @click="editor.chain().focus().toggleBulletList().run()"
      >• List</button>
      <button
        type="button"
        class="px-2 py-1 text-xs rounded hover:bg-slate-200 transition-colors"
        :class="{ 'bg-slate-200': editor.isActive('orderedList') }"
        @click="editor.chain().focus().toggleOrderedList().run()"
      >1. List</button>
      <button
        type="button"
        class="px-2 py-1 text-xs rounded hover:bg-slate-200 transition-colors"
        :class="{ 'bg-slate-200': editor.isActive('blockquote') }"
        @click="editor.chain().focus().toggleBlockquote().run()"
      >" Quote</button>
      <span class="w-px h-4 bg-slate-300 mx-1" />
      <button
        type="button"
        class="px-2 py-1 text-xs rounded hover:bg-slate-200 transition-colors"
        @click="editor.chain().focus().setHorizontalRule().run()"
      >HR</button>
      <button
        type="button"
        class="px-2 py-1 text-xs rounded hover:bg-slate-200 transition-colors"
        :class="{ 'bg-slate-200': editor.isActive('link') }"
        @click="() => {
          const url = window.prompt('URL')
          if (url) editor.chain().focus().setLink({ href: url }).run()
          else editor.chain().focus().unsetLink().run()
        }"
      >Link</button>
    </div>
    <EditorContent
      :editor="editor"
      class="prose prose-sm max-w-none p-4 min-h-[400px] focus-within:outline-none overflow-y-auto"
    />
  </div>
</template>

<style>
.tiptap {
  min-height: 400px;
  outline: none;
}
.tiptap p.is-editor-empty:first-child::before {
  color: #94a3b8;
  content: attr(data-placeholder);
  float: left;
  height: 0;
  pointer-events: none;
}
</style>
