import { router } from 'expo-router';
import { useState } from 'react';

import { createTicket, MAX_MESSAGE_LENGTH, MAX_SUBJECT_LENGTH, TICKET_CATEGORIES, TICKET_PRIORITIES } from '@/api/panel';
import { Button, Chip, ChipRow, InlineError, Page, SectionTitle, TextField } from '@/components/ui';
import { useApiMutation } from '@/hooks/useApiQuery';
import { t } from '@/i18n';

export default function NewTicketScreen() {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [category, setCategory] = useState<string>('GENERAL');
  const [priority, setPriority] = useState<string>('NORMAL');
  const save = useApiMutation();

  const submit = async () => {
    if (!subject.trim() || !message.trim()) return save.setError(t('Konu ve mesaj zorunludur.'));
    let id: string | null = null;
    const ok = await save.run(async (client) => {
      id = (await createTicket(client, { subject: subject.trim(), message: message.trim(), category, priority })).id;
    });
    if (ok && id) router.replace({ pathname: '/support/[id]', params: { id } });
  };

  return (
    <Page>
      <TextField label={t('Konu')} value={subject} onChangeText={setSubject} maxLength={MAX_SUBJECT_LENGTH} placeholder={t('Kısaca konuyu yazın')} />
      <SectionTitle>{t('Kategori')}</SectionTitle>
      <ChipRow>
        {TICKET_CATEGORIES.map((c) => (
          <Chip key={c.id} label={c.label} selected={category === c.id} onPress={() => setCategory(c.id)} />
        ))}
      </ChipRow>
      <SectionTitle>{t('Öncelik')}</SectionTitle>
      <ChipRow>
        {TICKET_PRIORITIES.map((p) => (
          <Chip key={p.id} label={p.label} selected={priority === p.id} onPress={() => setPriority(p.id)} />
        ))}
      </ChipRow>
      <TextField label={t('Mesajınız')} value={message} onChangeText={setMessage} multiline maxLength={MAX_MESSAGE_LENGTH} placeholder={t('Sorunu veya sorunuzu ayrıntılı anlatın')} />
      <InlineError message={save.error} />
      <Button label={t('Talebi gönder')} onPress={submit} busy={save.busy} />
    </Page>
  );
}
