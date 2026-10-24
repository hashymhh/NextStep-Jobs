import React, { useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Avatar } from '../../components/ui/Avatar';
import {
  AdminOperatorGrant,
  AdminPermissionScope,
  AdminTier,
  Profile,
} from '../../types';
import {
  ADMIN_TIER_METADATA,
  ALL_ADMIN_SCOPES,
  ROLE_PERMISSION_MATRIX,
  resolveAdminPermissions,
} from './adminUtils';
import { formatDateTimePKT } from '../../lib/locale/pakistan';
import { Check, Lock, Shield, UserPlus, X } from 'lucide-react';
import { toast } from 'sonner';

interface AdminAuthorizationsSectionProps {
  currentUserId: string;
  isBaseAdmin: boolean;
  users: Profile[];
  operatorGrants: AdminOperatorGrant[];
  canAssignRoles: boolean;
  onSetOperatorTier: (userId: string, tier: AdminTier) => void;
  onToggleOperatorScope: (userId: string, scope: AdminPermissionScope) => void;
  onRevokeOperator: (userId: string) => void;
}

const TIER_KEYS: AdminTier[] = [
  'super_admin',
  'trust_safety_admin',
  'recruiter_ops_admin',
  'content_moderator',
];

export const AdminAuthorizationsSection: React.FC<AdminAuthorizationsSectionProps> = ({
  currentUserId,
  isBaseAdmin,
  users,
  operatorGrants,
  canAssignRoles,
  onSetOperatorTier,
  onToggleOperatorScope,
  onRevokeOperator,
}) => {
  const [selectedCandidateId, setSelectedCandidateId] = useState<string>('');
  const [selectedTier, setSelectedTier] = useState<AdminTier>('trust_safety_admin');
  const [expandedOperatorId, setExpandedOperatorId] = useState<string>(
    operatorGrants.find((g) => g.tier !== 'super_admin')?.user_id ||
      operatorGrants[0]?.user_id ||
      'usr_admin_alex'
  );

  const myEffectiveScopes = resolveAdminPermissions(
    currentUserId,
    operatorGrants,
    isBaseAdmin
  );

  const eligibleNewOperators = users.filter(
    (u) => u.status === 'active' && !operatorGrants.some((g) => g.user_id === u.id)
  );

  const handleGrantNewOperator = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canAssignRoles) {
      toast.error('Missing required scope: roles:assign');
      return;
    }
    const targetId = selectedCandidateId || eligibleNewOperators[0]?.id;
    if (!targetId) {
      toast.error('Select an active member to delegate administrative scopes.');
      return;
    }
    onSetOperatorTier(targetId, selectedTier);
    setExpandedOperatorId(targetId);
    setSelectedCandidateId('');
    toast.success('Delegated administrative tier and updated RBAC matrix.');
  };

  return (
    <div className="space-y-5">
      {/* Current Session Effective Authority Summary */}
      <Card padding="md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#0A66C2] dark:text-[#71B7FB]" />
              <span>Active Session Authorization Envelope</span>
            </h2>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Effective capabilities enforced on every sensitive governance mutation and logged to the FNV-1a audit chain.
            </p>
          </div>
          <div className="text-right shrink-0 tabular-nums">
            <p className="text-lg font-bold text-[#0A66C2] dark:text-[#71B7FB]">
              {myEffectiveScopes.length} / {ALL_ADMIN_SCOPES.length} Scopes
            </p>
            <p className="text-xs text-gray-500">
              {canAssignRoles ? 'Sovereign RBAC Write Access' : 'Scoped Delegated Operator'}
            </p>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800 flex flex-wrap gap-x-4 gap-y-1.5 text-xs">
          {ALL_ADMIN_SCOPES.map((item) => {
            const granted = myEffectiveScopes.includes(item.scope);
            return (
              <span
                key={item.scope}
                className={`inline-flex items-center gap-1 font-mono ${
                  granted
                    ? 'text-emerald-700 dark:text-emerald-400 font-semibold'
                    : 'text-gray-400 dark:text-gray-600 line-through'
                }`}
              >
                {granted ? <Check className="w-3.5 h-3.5" /> : <Lock className="w-3 h-3" />}
                <span>{item.scope}</span>
              </span>
            );
          })}
        </div>
      </Card>

      {/* Delegated Operators & Granular Scope Override Editor */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <Card padding="md" className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                Authorized Console Operators ({operatorGrants.length})
              </h3>
              <p className="text-xs text-gray-500">
                Select an operator to customize granular permission overrides.
              </p>
            </div>
          </div>

          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {operatorGrants.map((grant) => {
              const member = users.find((u) => u.id === grant.user_id);
              const effective = resolveAdminPermissions(
                grant.user_id,
                operatorGrants,
                member?.role === 'admin'
              );
              const isSelected = expandedOperatorId === grant.user_id;

              return (
                <div
                  key={grant.user_id}
                  className={`py-3 px-2 rounded-lg transition-colors ${
                    isSelected ? 'bg-blue-50/60 dark:bg-blue-950/25' : ''
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => setExpandedOperatorId(grant.user_id)}
                      className="flex items-center gap-2.5 text-left cursor-pointer min-w-0 flex-1"
                    >
                      <Avatar
                        name={
                          member
                            ? `${member.first_name} ${member.last_name}`
                            : grant.user_id
                        }
                        src={member?.avatar_url}
                        size="sm"
                        verified={member?.verified}
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-gray-900 dark:text-white truncate">
                          {member
                            ? `${member.first_name} ${member.last_name}`
                            : grant.user_id}
                        </p>
                        <p className="text-[11px] text-gray-500 truncate tabular-nums">
                          {ADMIN_TIER_METADATA[grant.tier].label} · {effective.length}/
                          {ALL_ADMIN_SCOPES.length} scopes
                        </p>
                      </div>
                    </button>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <select
                        aria-label={`Change admin tier for ${member?.first_name || grant.user_id}`}
                        disabled={!canAssignRoles || grant.user_id === 'usr_admin_alex'}
                        value={grant.tier}
                        onChange={(e) => {
                          onSetOperatorTier(grant.user_id, e.target.value as AdminTier);
                          toast.success('Updated operator RBAC tier');
                        }}
                        className="text-xs px-2 py-1 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#12161A] text-gray-900 dark:text-white disabled:opacity-50"
                      >
                        {TIER_KEYS.map((tk) => (
                          <option key={tk} value={tk}>
                            {ADMIN_TIER_METADATA[tk].label}
                          </option>
                        ))}
                      </select>

                      {grant.user_id !== 'usr_admin_alex' && (
                        <button
                          type="button"
                          disabled={!canAssignRoles}
                          aria-label={`Revoke admin access for ${member?.first_name || grant.user_id}`}
                          onClick={() => {
                            onRevokeOperator(grant.user_id);
                            if (expandedOperatorId === grant.user_id) {
                              setExpandedOperatorId('usr_admin_alex');
                            }
                            toast.info('Revoked delegated operator authority');
                          }}
                          className="p-1.5 rounded text-gray-400 hover:text-[#CC1016] hover:bg-red-50 dark:hover:bg-red-950/30 disabled:opacity-40 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Delegate New Operator Form */}
          <form
            onSubmit={handleGrantNewOperator}
            className="pt-3 border-t border-gray-200 dark:border-gray-800 space-y-2.5"
          >
            <p className="text-xs font-bold text-gray-800 dark:text-gray-200 flex items-center gap-1.5">
              <UserPlus className="w-3.5 h-3.5 text-[#0A66C2]" />
              <span>Delegate Authority to Member</span>
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <select
                aria-label="Select member to delegate authority"
                disabled={!canAssignRoles}
                value={selectedCandidateId || eligibleNewOperators[0]?.id || ''}
                onChange={(e) => setSelectedCandidateId(e.target.value)}
                className="text-xs px-2.5 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#12161A] text-gray-900 dark:text-white"
              >
                {eligibleNewOperators.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.first_name} {u.last_name} (@{u.handle})
                  </option>
                ))}
              </select>

              <select
                aria-label="Select RBAC tier to grant"
                disabled={!canAssignRoles}
                value={selectedTier}
                onChange={(e) => setSelectedTier(e.target.value as AdminTier)}
                className="text-xs px-2.5 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#12161A] text-gray-900 dark:text-white"
              >
                {TIER_KEYS.map((tk) => (
                  <option key={tk} value={tk}>
                    {ADMIN_TIER_METADATA[tk].label}
                  </option>
                ))}
              </select>
            </div>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={!canAssignRoles || eligibleNewOperators.length === 0}
              className="w-full justify-center"
            >
              Grant Delegated Console Authority
            </Button>
          </form>
        </Card>

        {/* Right: Per-Operator Scope Checkboxes */}
        <Card padding="md" className="lg:col-span-7 space-y-3">
          {(() => {
            const targetGrant =
              operatorGrants.find((g) => g.user_id === expandedOperatorId) ||
              operatorGrants[0];
            if (!targetGrant) return null;
            const targetUser = users.find((u) => u.id === targetGrant.user_id);
            const effectiveScopes = resolveAdminPermissions(
              targetGrant.user_id,
              operatorGrants,
              targetUser?.role === 'admin'
            );
            const isPrimaryRoot = targetGrant.user_id === 'usr_admin_alex';

            return (
              <>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-gray-100 dark:border-gray-800">
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                      Granular Scope Matrix:{' '}
                      {targetUser
                        ? `${targetUser.first_name} ${targetUser.last_name}`
                        : targetGrant.user_id}
                    </h3>
                    <p className="text-xs text-gray-500 tabular-nums">
                      Base Tier: {ADMIN_TIER_METADATA[targetGrant.tier].label} · Last modified{' '}
                      {formatDateTimePKT(targetGrant.updated_at)} by {targetGrant.updated_by}
                    </p>
                  </div>
                  {isPrimaryRoot && (
                    <span className="text-xs font-semibold text-[#0A66C2] dark:text-[#71B7FB]">
                      Root Sovereign Protected
                    </span>
                  )}
                </div>

                <div className="divide-y divide-gray-100 dark:divide-gray-800">
                  {ALL_ADMIN_SCOPES.map((item) => {
                    const checked = effectiveScopes.includes(item.scope);
                    const isOverriddenGrant = targetGrant.custom_granted.includes(item.scope);
                    const isOverriddenRevoke = targetGrant.custom_revoked.includes(item.scope);

                    return (
                      <div
                        key={item.scope}
                        className="py-2.5 flex items-center justify-between gap-4"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-bold text-gray-900 dark:text-white">
                              {item.label}
                            </span>
                            <span className="text-[11px] font-mono text-gray-500">
                              · {item.scope}
                            </span>
                            {isOverriddenGrant && (
                              <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                                · Custom Granted
                              </span>
                            )}
                            {isOverriddenRevoke && (
                              <span className="text-[11px] font-semibold text-[#CC1016] dark:text-red-400">
                                · Custom Revoked
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>
                        </div>

                        <button
                          type="button"
                          role="switch"
                          aria-checked={checked}
                          aria-label={`Toggle ${item.scope} for ${targetUser?.first_name || targetGrant.user_id}`}
                          disabled={!canAssignRoles || (isPrimaryRoot && item.scope === 'roles:assign')}
                          onClick={() => {
                            onToggleOperatorScope(targetGrant.user_id, item.scope);
                            toast.success(`Updated scope ${item.scope}`);
                          }}
                          className={`relative w-11 h-6 rounded-full transition-colors shrink-0 cursor-pointer disabled:opacity-40 ${
                            checked ? 'bg-[#0A66C2]' : 'bg-gray-300 dark:bg-gray-700'
                          }`}
                        >
                          <span
                            className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                              checked ? 'translate-x-5' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </>
            );
          })()}
        </Card>
      </div>

      {/* Reference Tier Matrix Table */}
      <Card padding="none" className="overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-800">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white">
            Standard RBAC Tier Authorization Matrix
          </h3>
          <p className="text-xs text-gray-500">
            Baseline capability blueprint inherited prior to operator-specific scope overrides.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-gray-50 dark:bg-[#161B22] border-b border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400">
                <th className="py-2.5 px-4 font-semibold">Permission Scope</th>
                {TIER_KEYS.map((tk) => (
                  <th key={tk} className="py-2.5 px-3 font-semibold text-center whitespace-nowrap">
                    {ADMIN_TIER_METADATA[tk].label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {ALL_ADMIN_SCOPES.map((s) => (
                <tr key={s.scope} className="hover:bg-gray-50/60 dark:hover:bg-gray-800/30">
                  <td className="py-2.5 px-4">
                    <span className="font-semibold text-gray-900 dark:text-white">{s.label}</span>
                    <span className="ml-2 font-mono text-[11px] text-gray-500">{s.scope}</span>
                  </td>
                  {TIER_KEYS.map((tk) => {
                    const included = ROLE_PERMISSION_MATRIX[tk].includes(s.scope);
                    return (
                      <td key={tk} className="py-2.5 px-3 text-center">
                        {included ? (
                          <span className="inline-flex items-center justify-center text-emerald-700 dark:text-emerald-400 font-semibold">
                            <Check className="w-4 h-4" aria-label="Included" />
                          </span>
                        ) : (
                          <span className="text-gray-300 dark:text-gray-600">—</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
