import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { View } from 'react-native';

import { fetchCustomers } from '@/api/business';
import { EmptyState } from '@/components/EmptyState';
import { icons } from '@/components/Icon';
import { ErrorView, LoadingView } from '@/components/StateViews';
import { ListRow, Page, TextField } from '@/components/ui';
import { useApiQuery } from '@/hooks/useApiQuery';
import { formatPrice } from '@/lib/appointments';
import { makeStyles, spacing } from '@/theme';

const PAGE = 50;

export default function CustomersScreen() {
  const styles = useStyles();
  const { data, loading, error, refreshing, refresh, retry } = useApiQuery(fetchCustomers);
  const [query, setQuery] = useState('');
  const [shown, setShown] = useState(PAGE);

  const filtered = useMemo(() => {
    const q = query.trim().toLocaleLowerCase('tr-TR');
    const digits = q.replace(/\D/g, '');
    return (data ?? []).filter(
      (c) => !q || c.name.toLocaleLowerCase('tr-TR').includes(q) || (digits.length > 0 && c.phone.replace(/\D/g, '').includes(digits))
    );
  }, [data, query]);

  return (
    <Page onRefresh={refresh} refreshing={refreshing}>
      <TextField
        label="Ara"
        placeholder="Ad veya telefon"
        value={query}
        onChangeText={(v) => {
          setQuery(v);
          setShown(PAGE);
        }}
        autoCorrect={false}
        clearButtonMode="while-editing"
      />

      {loading ? <LoadingView /> : null}
      {error ? <ErrorView message={error} onRetry={retry} /> : null}
      {data && !error ? (
        filtered.length === 0 ? (
          <EmptyState
            title={query ? 'Sonuç bulunamadı' : 'Henüz müşteri yok'}
            description={query ? 'Farklı bir ad veya numara deneyin.' : 'Randevu alan müşteriler burada otomatik olarak listelenir.'}
          />
        ) : (
          <View style={styles.list}>
            {filtered.slice(0, shown).map((c) => (
              <ListRow
                key={c.id}
                icon={icons.user}
                title={c.name}
                subtitle={`${c.phone} · ${c.totalAppointments} randevu`}
                meta={formatPrice(c.totalSpent)}
                onPress={() => router.push({ pathname: '/customers/[id]', params: { id: c.id } })}
              />
            ))}
            {filtered.length > shown ? (
              <ListRow title={`Daha fazla göster (${filtered.length - shown})`} onPress={() => setShown((n) => n + PAGE)} />
            ) : null}
          </View>
        )
      ) : null}
    </Page>
  );
}

const useStyles = makeStyles(() => ({
  list: { gap: spacing.sm },
}));
