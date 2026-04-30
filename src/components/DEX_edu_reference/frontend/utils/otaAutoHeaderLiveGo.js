/**
 * Pure helper: LIVE GO / NO-GO pentru header OTA Auto (policy on-chain, worker, session backend, guards).
 * Extrase din OTAPage pentru teste și o singură sursă de adevăr pentru motivele afișate.
 */
import { isBotAuthorized as isBotAuthorizedUtil } from './otaTradingModes';

/**
 * @param {object} input
 * @param {boolean} input.isRegistered
 * @param {unknown} input.botAuthorizations
 * @param {string|null|undefined} input.executorBotAddress
 * @param {{ enabled?: boolean }|null|undefined} input.policy
 * @param {object|null|undefined} input.autoExecutionStatus
 * @param {{ level66?: object, level73?: object, level74?: object }|null|undefined} input.guards
 * @returns {{ liveGo: boolean, reasons: string[] }}
 */
export function computeOtaHeaderLiveGo({
  isRegistered,
  botAuthorizations,
  executorBotAddress,
  policy,
  autoExecutionStatus,
  guards,
}) {
  const level66 = guards?.level66;
  const level73 = guards?.level73;
  const level74 = guards?.level74;
  const botAuthorized = isBotAuthorizedUtil(botAuthorizations, executorBotAddress);
  const workerActive = autoExecutionStatus?.executorFunctional === true;
  const policyEnabled = policy?.enabled === true;
  const clarity = autoExecutionStatus?.otaAutoClarity;
  const level66Blocked = level66?.decision?.allowAutoStart === false;
  const level73Blocked = level73?.decision?.allowAutoStart === false;
  const level74Blocked = level74?.decision?.allowAutoStart === false;
  const reasons = [
    !isRegistered ? 'registration' : null,
    !botAuthorized ? 'bot authorization' : null,
    !policyEnabled ? 'policy disabled (on-chain)' : null,
    !workerActive ? 'executor worker not running' : null,
    clarity?.safetyBlockedBsc ? 'safety stop (BSC)' : null,
    clarity?.chainPolicyEnabled === true && clarity?.backendSessionRegistered === false
      ? 'chain policy ON but backend session not registered (reload or policy/get)'
      : null,
    clarity?.chainPolicyEnabled === false && clarity?.backendSessionRegistered === true
      ? 'backend session active but chain policy OFF — sync on-chain or stop session'
      : null,
    level66Blocked ? 'Level66 guard active' : null,
    level73Blocked ? 'Level73 execution quality guard active' : null,
    level74Blocked ? 'Level74 guard active' : null,
  ].filter(Boolean);
  const liveGo = Boolean(
    isRegistered &&
      botAuthorized &&
      policyEnabled &&
      workerActive &&
      !clarity?.safetyBlockedBsc &&
      !level66Blocked &&
      !level73Blocked &&
      !level74Blocked
  );
  return { liveGo, reasons };
}
