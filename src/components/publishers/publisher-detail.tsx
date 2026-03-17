'use client';

import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardAction,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PublisherStatusBadge } from '@/components/publishers/publisher-status-badge';
import { PublisherForm } from '@/components/publishers/publisher-form';
import { PublisherDeleteDialog } from '@/components/publishers/publisher-delete-dialog';
import { PublisherHistory } from '@/components/publishers/publisher-history';
import { PublisherWorkload } from '@/components/publishers/publisher-workload';
import {
  reactivatePublisherAction,
  changeStatusAction,
} from '@/app/[locale]/(protected)/publishers/actions';
import type { PublisherWithMeta } from '@/data/publishers';
import { PublisherStatus } from '@/generated/prisma/enums';
import {
  PencilIcon,
  TrashIcon,
  RotateCcwIcon,
  CheckCircleIcon,
  XCircleIcon,
} from 'lucide-react';

type PublisherDetailProps = {
  publisher: PublisherWithMeta;
};

export function PublisherDetail({ publisher }: PublisherDetailProps) {
  const t = useTranslations('publishers');
  const tc = useTranslations('common');
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const isActive = publisher.estado === PublisherStatus.ACTIVE;
  const isInactive = publisher.estado === PublisherStatus.INACTIVE;
  const isAbsent = publisher.estado === PublisherStatus.ABSENT;
  const isRestricted = publisher.estado === PublisherStatus.RESTRICTED;

  const handleReactivate = () => {
    startTransition(async () => {
      const result = await reactivatePublisherAction(publisher.id);
      if (result.success) router.refresh();
    });
  };

  const handleStatusChange = (newStatus: PublisherStatus) => {
    startTransition(async () => {
      const result = await changeStatusAction(publisher.id, newStatus);
      if (result.success) router.refresh();
    });
  };

  return (
    <>
      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">{t('detail.profileTab')}</TabsTrigger>
          <TabsTrigger value="history">{t('detail.historyTab')}</TabsTrigger>
          <TabsTrigger value="workload">{t('detail.workloadTab')}</TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>{publisher.nombre}</CardTitle>
              <CardAction>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setFormOpen(true)}
                  >
                    <PencilIcon className="size-4" data-icon="inline-start" />
                    {tc('edit')}
                  </Button>

                  {/* Status change buttons */}
                  {isActive && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handleStatusChange(PublisherStatus.ABSENT)
                        }
                        disabled={isPending}
                      >
                        {t('status.ABSENT')}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handleStatusChange(PublisherStatus.RESTRICTED)
                        }
                        disabled={isPending}
                      >
                        {t('status.RESTRICTED')}
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setDeleteOpen(true)}
                      >
                        <TrashIcon
                          className="size-4"
                          data-icon="inline-start"
                        />
                        {tc('delete')}
                      </Button>
                    </>
                  )}

                  {(isAbsent || isRestricted) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleStatusChange(PublisherStatus.ACTIVE)}
                      disabled={isPending}
                    >
                      {t('status.ACTIVE')}
                    </Button>
                  )}

                  {isInactive && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleReactivate}
                      disabled={isPending}
                    >
                      <RotateCcwIcon
                        className="size-4"
                        data-icon="inline-start"
                      />
                      {t('actions.reactivate')}
                    </Button>
                  )}
                </div>
              </CardAction>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
                {/* Status */}
                <div>
                  <dt className="text-sm text-muted-foreground">
                    {t('form.status')}
                  </dt>
                  <dd className="mt-1">
                    <PublisherStatusBadge status={publisher.estado} />
                  </dd>
                </div>

                {/* Gender */}
                <div>
                  <dt className="text-sm text-muted-foreground">
                    {t('form.gender')}
                  </dt>
                  <dd className="mt-1">
                    <Badge variant="secondary">
                      {t(`gender.${publisher.sexo}`)}
                    </Badge>
                  </dd>
                </div>

                {/* Role */}
                <div>
                  <dt className="text-sm text-muted-foreground">
                    {t('form.role')}
                  </dt>
                  <dd className="mt-1">{t(`role.${publisher.rol}`)}</dd>
                </div>

                {/* Baptized */}
                <div>
                  <dt className="text-sm text-muted-foreground">
                    {t('detail.baptized')}
                  </dt>
                  <dd className="mt-1">
                    {publisher.bautizado
                      ? t('detail.baptized')
                      : t('detail.notBaptized')}
                  </dd>
                </div>

                {/* Fecha fin ausencia */}
                {publisher.estado === PublisherStatus.ABSENT &&
                  publisher.fechaFinAusencia && (
                    <div>
                      <dt className="text-sm text-muted-foreground">
                        {t('form.absenceEndDate')}
                      </dt>
                      <dd className="mt-1">
                        {new Date(
                          publisher.fechaFinAusencia
                        ).toLocaleDateString()}
                      </dd>
                    </div>
                  )}

                {/* Enablement flags */}
                <div>
                  <dt className="text-sm text-muted-foreground">
                    {t('form.vmcEnabled')}
                  </dt>
                  <dd className="mt-1">
                    <EnabledIndicator enabled={publisher.habilitadoVMC} />
                  </dd>
                </div>

                <div>
                  <dt className="text-sm text-muted-foreground">
                    {t('form.attendantEnabled')}
                  </dt>
                  <dd className="mt-1">
                    <EnabledIndicator
                      enabled={publisher.habilitadoAcomodador}
                    />
                  </dd>
                </div>

                <div>
                  <dt className="text-sm text-muted-foreground">
                    {t('form.microphoneEnabled')}
                  </dt>
                  <dd className="mt-1">
                    <EnabledIndicator enabled={publisher.habilitadoMicrofono} />
                  </dd>
                </div>

                <div>
                  <dt className="text-sm text-muted-foreground">
                    {t('form.skipAssignment')}
                  </dt>
                  <dd className="mt-1">
                    <EnabledIndicator enabled={publisher.skipAssignment} />
                  </dd>
                </div>

                {/* Observaciones */}
                {publisher.observaciones && (
                  <div className="sm:col-span-2 lg:col-span-3">
                    <dt className="text-sm text-muted-foreground">
                      {t('form.observations')}
                    </dt>
                    <dd className="mt-1 whitespace-pre-wrap text-sm">
                      {publisher.observaciones}
                    </dd>
                  </div>
                )}

                {/* Timestamps */}
                <div>
                  <dt className="text-sm text-muted-foreground">
                    {t('detail.createdAt')}
                  </dt>
                  <dd className="mt-1 text-sm">
                    {new Date(publisher.createdAt).toLocaleDateString()}
                  </dd>
                </div>

                <div>
                  <dt className="text-sm text-muted-foreground">
                    {t('detail.updatedAt')}
                  </dt>
                  <dd className="mt-1 text-sm">
                    {new Date(publisher.updatedAt).toLocaleDateString()}
                  </dd>
                </div>

                {/* Total assignments */}
                {publisher._count && (
                  <div>
                    <dt className="text-sm text-muted-foreground">
                      {t('table.totalAssignments')}
                    </dt>
                    <dd className="mt-1 text-sm">
                      {publisher._count.assignmentsAsTitular}
                    </dd>
                  </div>
                )}
              </dl>
            </CardContent>
          </Card>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history">
          <PublisherHistory publisherId={publisher.id} />
        </TabsContent>

        {/* Workload Tab */}
        <TabsContent value="workload">
          <PublisherWorkload publisherId={publisher.id} />
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <PublisherForm
        publisher={publisher}
        open={formOpen}
        onOpenChange={setFormOpen}
      />
      <PublisherDeleteDialog
        publisher={publisher}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
      />
    </>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────

function EnabledIndicator({ enabled }: { enabled: boolean }) {
  return enabled ? (
    <CheckCircleIcon className="size-4 text-green-600" />
  ) : (
    <XCircleIcon className="size-4 text-muted-foreground" />
  );
}
