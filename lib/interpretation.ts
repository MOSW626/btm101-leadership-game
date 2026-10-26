import type { AxisSummary, Result } from './brief/scoring.mjs';
import type { Text } from './content';

const text = (ko: string, en: string): Text => ({ ko, en });
export type AxisReading = { reading: Text; useful: Text; watch: Text; next: Text };
export const axisReadings: Record<string, Record<'L' | 'M' | 'X', AxisReading>> = {
  direction: {
    L: {
      reading: text('무엇을 언제 끝낼지 정하기 전에, 이 일이 어디를 향해야 하는지부터 확인하려는 응답이 많았어요. 이미 정해진 방식이 있어도 지금 풀어야 할 문제와 맞는지 다시 물어보는 쪽에 가까워요.', 'Your answers favor asking where the work should go before deciding exactly what to finish and when. You tend to revisit whether an existing approach still fits the problem at hand.'),
      useful: text('팀이 바쁘게 움직이지만 무엇을 위해 하는지 흐릿하거나, 상황이 바뀌어 기존 목표를 다시 살펴야 할 때 꺼내 볼 행동이에요.', 'These actions may help when a team is busy but unclear about its purpose, or when changed circumstances call the existing goal into question.'),
      watch: text('방향을 충분히 이야기했어도 다음 행동이 정해지지 않을 수 있어요. 의미에 대한 합의가 실행 계획으로 이어졌는지 확인해 보세요.', 'A good discussion of direction can still leave the next step unclear. Check that agreement on purpose becomes a workable plan.'),
      next: text('지키고 싶은 목표를 한 문장으로 적고, 그 목표를 위해 이번 주에 끝낼 작업 하나와 필요한 시간을 붙여 보세요.', 'Write the goal you want to preserve in one sentence, then add one task to finish this week and the time it needs.'),
    },
    M: {
      reading: text('큰 방향을 더 이야기하기보다, 주어진 시간과 자원으로 무엇을 해낼 수 있는지 구체화하는 응답이 많았어요. 막연한 과제를 일정·비용·작업 범위로 바꾸는 쪽을 먼저 택했어요.', 'Your answers favor making the work feasible with the time and resources available. You chose to turn a broad assignment into a schedule, budget, or scope before extending the discussion of direction.'),
      useful: text('해야 할 일은 알지만 규모가 크고 제약이 많아서 어디서 시작할지 막막할 때 꺼내 볼 행동이에요.', 'These actions may help when the work is broadly understood but its size and constraints make it hard to begin.'),
      watch: text('계획을 잘 실행하는 것과 그 계획이 여전히 필요한 것은 별개예요. 상황이 바뀌었다면 목표 자체도 다시 확인해 보세요.', 'Executing a plan well does not establish that the plan is still needed. Revisit the goal itself when circumstances change.'),
      next: text('다음 일정 회의에서 할 일을 나열하기 전에, 이 계획으로 누구의 어떤 문제를 풀려는지 먼저 한 문장으로 확인해 보세요.', 'Before listing tasks at the next planning meeting, state whose problem the plan is meant to solve in one sentence.'),
    },
    X: {
      reading: text('방향을 다시 잡는 행동과 실행 계획을 세우는 행동 사이에서, 한쪽을 일관되게 먼저 한다고 묶기 어려운 응답이었어요. 아래 분포를 보면 두 행동을 비슷하게 봤는지, 상황별로 다르게 골랐는지 알 수 있어요.', 'Your answers do not show a clear overall priority between revisiting direction and making an implementation plan. The distribution below helps distinguish similar priorities from choices that changed with the situation.'),
      useful: text('다음 팀플에서 무엇을 먼저 고를지 관찰할 출발점으로 삼아 보세요. 이번 결과만으로 양쪽을 모두 잘한다고 판단할 수는 없어요.', 'Use this as a starting point for observing what you choose first in your next project. It does not establish skill in both activities.'),
      watch: text('평균이 비슷해도 이유는 다를 수 있어요. 목표가 모호할 때와 시간이 부족할 때 무엇을 달리 골랐는지 비교해 보세요.', 'Similar averages can arise for different reasons. Compare what you chose when the goal was unclear with what you chose when time was limited.'),
      next: text('방향 질문 중 답이 달랐던 두 개를 골라, 먼저 해야 할 일을 바꾼 조건이 무엇이었는지 적어 보세요.', 'Choose two direction questions where your answers differed and note which condition changed your first priority.'),
    },
  },
  people: {
    L: {
      reading: text('누가 무엇을 맡을지 나누기 전에, 사람들이 같은 목표를 이해하고 그 일에 뜻을 모으게 하는 행동을 먼저 골랐어요. 역할을 배정하는 것만으로는 함께 움직이기 어렵다고 보는 응답에 가까워요.', 'You favored building shared understanding and commitment before dividing responsibilities. Your choices suggest that assigning roles alone may not feel sufficient to get people moving together.'),
      useful: text('각자 원하는 것이 다르거나, 함께할 이유를 납득해야 참여가 이어지는 협업에서 꺼내 볼 행동이에요.', 'These actions may help when people want different things or need a shared reason to stay involved.'),
      watch: text('뜻이 모여도 책임이 흐릿하면 작업이 빠질 수 있어요. 합의가 생긴 뒤에는 결정할 사람과 맡을 일을 구체적으로 남겨 보세요.', 'Even with shared commitment, unclear responsibility can leave work undone. Follow agreement with explicit owners and decision rights.'),
      next: text('다음 회의에서 팀원들의 목표를 한 번씩 들은 뒤, 합의한 일마다 담당자와 협업할 사람을 적어 보세요.', 'At the next meeting, hear each person’s goal, then record an owner and collaborators for each agreed task.'),
    },
    M: {
      reading: text('뜻을 모으는 대화보다 역할·책임·협업 절차를 분명하게 만드는 행동을 먼저 골랐어요. 서로 무엇을 기대해도 되는지 명확해지면 함께 일하기 쉬워진다고 보는 응답에 가까워요.', 'You favored clarifying roles, responsibilities, and coordination before building wider agreement. Your choices suggest that clear expectations are an important starting point for working together.'),
      useful: text('서로 일을 중복해서 하거나, 누구의 결정인지 몰라 진행이 늦어지는 협업에서 꺼내 볼 행동이에요.', 'These actions may help when work is duplicated or delayed because people do not know who should decide.'),
      watch: text('역할을 정확히 알아도 그 일에 동의하거나 의욕을 느끼는 것은 아닐 수 있어요. 각자가 목표를 어떻게 이해하는지도 들어 보세요.', 'Knowing one’s role does not necessarily mean supporting it or feeling motivated. Ask how each person understands the shared goal.'),
      next: text('업무를 나누기 전에 각자가 이 프로젝트에서 중요하게 생각하는 것을 한 가지씩 말할 시간을 만들어 보세요.', 'Before assigning work, give each person time to name one thing that matters to them in the project.'),
    },
    X: {
      reading: text('공감대를 만드는 행동과 역할을 정리하는 행동 중 어느 쪽을 먼저 하는지 이번 응답만으로 단정하기 어려워요. 상황마다 필요한 연결 방식이 다르게 보였을 수도 있어요.', 'Your answers do not clearly favor shared commitment or role clarity as the first step. Different situations may have called for different ways of bringing people together.'),
      useful: text('다음 협업에서 불일치의 원인이 목표에 대한 이견인지, 역할의 혼선인지 구분해 보는 데 활용해 보세요.', 'Use this as a prompt to distinguish disagreements about purpose from confusion about responsibilities in your next collaboration.'),
      watch: text('이 결과가 사람을 잘 다룬다는 뜻은 아니에요. 두 행동을 비슷하게 중요하게 봤는지, 판단할 맥락이 부족했는지도 돌아보세요.', 'This does not measure how well you work with people. Consider whether the two actions felt equally urgent or whether you needed more context.'),
      next: text('협업이 막혔을 때 목표와 역할 중 무엇이 더 불분명한지 한 번 묻고, 답에 맞는 행동을 골라 보세요.', 'When collaboration stalls, ask whether the goal or the responsibilities are less clear, then choose your next action accordingly.'),
    },
  },
  execution: {
    L: {
      reading: text('일이 멈추거나 팀이 지쳤을 때, 진행을 확인하기 전에 다시 해 볼 이유와 자신감을 만드는 행동을 먼저 골랐어요. 실행을 이어 가려면 사람들이 계속하고 싶어 하는 힘도 필요하다고 보는 응답에 가까워요.', 'When work stalled or people tired, you favored renewing reasons and confidence to continue before reviewing progress. Your choices emphasize the motivation needed to sustain action.'),
      useful: text('할 일과 절차가 있어도 참여 의욕이 낮아 움직이지 않는 상황에서 꺼내 볼 행동이에요.', 'These actions may help when tasks and procedures exist but people lack the motivation to act on them.'),
      watch: text('의욕을 북돋우는 것만으로 실제 병목이나 반복되는 오류가 없어지지는 않아요. 다시 움직이기 시작하면 결과와 계획의 차이도 확인해 보세요.', 'Encouragement alone may not remove a bottleneck or recurring error. Once work resumes, compare actual results with the plan too.'),
      next: text('다음 점검에서 최근의 기여 하나를 인정한 뒤, 아직 막혀 있는 작업 하나와 해결 방법을 함께 정해 보세요.', 'At the next check-in, recognize one recent contribution, then identify one blocked task and agree how to address it.'),
    },
    M: {
      reading: text('일이 멈추거나 결과가 기대에 못 미칠 때, 현황과 계획의 차이를 찾아 작업 방식을 고치는 행동을 먼저 골랐어요. 계속할 힘을 이야기하기 전에 실제로 진행을 막는 조건을 줄이려는 응답에 가까워요.', 'When work stalled or results fell short, you favored finding gaps against the plan and adjusting how work was done. Your choices emphasize removing practical obstacles before renewing motivation.'),
      useful: text('지연 원인이 쌓이거나 같은 실수가 반복되어, 무엇을 고쳐야 할지 구체적으로 확인해야 할 때 꺼내 볼 행동이에요.', 'These actions may help when delays or repeated mistakes call for a concrete diagnosis and correction.'),
      watch: text('계속 확인하고 고쳐도 사람들이 이 일을 할 이유를 잃으면 실행이 이어지기 어려울 수 있어요. 점검하면서 참여 의욕도 살펴보세요.', 'Repeated checks and corrections may not sustain action if people lose their reason to do the work. Attend to motivation alongside progress.'),
      next: text('진행률을 묻는 자리에서 가장 막힌 부분과 함께, 지금도 계속하고 싶게 하는 이유를 한 가지씩 물어보세요.', 'At a progress check, ask about the biggest obstacle and one reason each person still wants to continue.'),
    },
    X: {
      reading: text('동기를 되살리는 행동과 진행을 점검하는 행동 중 어느 쪽을 먼저 할지 한쪽으로 묶기 어려웠어요. 피로, 실패, 일정 변화에서 답이 어떻게 달랐는지 살펴보면 더 구체적으로 읽을 수 있어요.', 'Your answers do not show a clear overall priority between renewing motivation and reviewing progress. Compare your choices under fatigue, failure, and schedule changes for a more specific reading.'),
      useful: text('팀이 멈췄을 때 의욕의 문제와 실행 조건의 문제를 구분해 보는 질문으로 활용해 보세요.', 'Use this as a prompt to distinguish a motivation problem from a practical execution problem when a team stalls.'),
      watch: text('중앙에 가까운 평균은 언제나 상황에 맞게 대응한다는 증거가 아니에요. 문항별 답과 그 이유를 함께 봐야 해요.', 'A central average does not establish that you always adapt well. Read the individual answers and the reasons behind them together.'),
      next: text('최근 일이 막혔던 장면을 하나 떠올리고, 원인이 의욕이었는지 절차·자원이었는지 구분한 뒤 다음 행동을 적어 보세요.', 'Recall a recent stalled task, distinguish motivation from process or resource constraints, and write down a next action.'),
    },
  },
};

export const combinationReadings: Record<string, Text> = {
  LLL: text('방향을 찾고, 사람들의 뜻을 모으고, 계속할 힘을 만드는 행동이 세 축에서 함께 나타났어요. 새 시도를 시작할 때 꺼내 볼 순서예요. 이 흐름에 작업 계획·담당·점검을 붙이면 생각한 변화가 실제 결과로 이어지는지 확인할 수 있어요.', 'Across all three axes, you favored direction, shared commitment, and motivation. This is one sequence to try when starting something new. Add a plan, owners, and check-ins to see whether the intended change becomes a result.'),
  LLM: text('무엇을 위해 함께 갈지 먼저 맞추고, 실행 단계에서는 진행을 확인하는 조합이에요. 사람들의 동의를 얻는 대화와 결과를 확인하는 점검이 함께 나타났어요. 점검할 때도 처음 함께하겠다고 한 이유를 놓치지 않는지 살펴보세요.', 'You favored agreeing on a shared direction, then checking progress during execution. Your choices combine conversations that build commitment with follow-through. Keep revisiting the reasons people agreed to participate as you monitor results.'),
  LML: text('가야 할 방향을 먼저 찾되, 사람을 모을 때는 역할을 명확히 하고, 실행 중에는 의욕을 보태는 조합이에요. 맡을 자리를 정한 뒤 각자가 그 방향에 공감하는지도 확인하면 다음 행동을 더 구체화할 수 있어요.', 'You favored direction first, clear roles when organizing people, and renewed motivation during execution. After assigning responsibilities, check that each person supports the direction as well.'),
  LMM: text('방향을 정한 뒤 역할과 점검으로 구체화하려는 흐름이 나타났어요. 아이디어를 실행으로 옮길 때 써 볼 조합이에요. 방향을 제안한 사람이 생각한 의미와 실제로 맡은 사람이 이해한 의미가 같은지도 들어 보세요.', 'Your choices move from direction to roles and monitoring—a sequence to try when putting an idea into practice. Check that the meaning intended by the person proposing the direction matches what the people doing the work understand.'),
  MLL: text('실행 가능한 계획을 출발점으로 삼고, 사람들의 공감과 의욕으로 그 계획을 움직이려는 조합이에요. 함께하고 싶다는 마음이 생긴 뒤에도 담당과 진행 확인이 빠지지 않았는지 살펴보면 좋아요.', 'You favored a feasible plan as the starting point, followed by shared commitment and motivation. As people become engaged, check that responsibilities and progress checks have also been made explicit.'),
  MLM: text('계획으로 일을 구체화하고, 함께할 뜻을 모은 뒤, 진행을 점검하는 조합이에요. 정해진 목표를 여럿이 실행할 때 꺼내 볼 흐름이에요. 계획을 잘 지키는 동안에도 목표 자체를 바꿔야 할 이유가 생기지는 않았는지 돌아보세요.', 'You favored planning, shared commitment, and monitoring in sequence. This is one approach to carrying out an agreed goal together. While keeping the plan on track, revisit whether there is a reason to change the goal itself.'),
  MML: text('계획과 역할을 먼저 정리하고, 실행 단계에서 사람들이 계속할 힘을 보태려는 조합이에요. 일의 구조를 잡는 것과 사람의 의욕을 살피는 행동이 함께 나타났어요. 좋은 분위기와 별개로 실제 결과도 확인하는 시간을 남겨 보세요.', 'You favored plans and roles first, then motivation during execution. Your choices combine work structure with attention to people’s energy. Reserve time to check actual results as well as morale.'),
  MMM: text('무엇을 할지 계획하고, 맡을 일을 나누고, 진행을 확인하는 흐름이 세 축에서 나타났어요. 복잡한 일을 정리할 때 꺼내 볼 순서예요. 실행이 안정적일수록 지금도 같은 목표를 향해야 하는지, 사람들이 그 목표에 뜻을 모으고 있는지 따로 확인해 보세요.', 'Across all three axes, you favored planning, defined roles, and monitoring—a sequence to try when organizing complex work. Alongside reliable execution, revisit whether the goal still makes sense and whether people remain committed to it.'),
};

export const mixedPatterns = {
  midpoint: text('이 축에서는 여섯 문항 모두 4를 골랐어요. 두 행동의 우선순위를 비슷하게 봤다는 응답이에요. 다만 상황을 충분히 상상할 수 있었는지, 질문이 모호하지는 않았는지도 함께 돌아보세요.', 'You chose 4 on all six questions in this axis, indicating similar priority. Also consider whether you could picture the situations clearly and whether any wording felt ambiguous.'),
  opposed: text('이 축에서는 어떤 상황에서는 L 쪽을, 다른 상황에서는 M 쪽을 골랐어요. 양쪽 선택이 평균에서 상쇄된 결과일 수 있어요. 서로 다른 답을 고른 두 상황을 비교해 보세요.', 'You chose the L side in some situations and the M side in others. Those choices may offset in the average. Compare two situations where you chose different sides.'),
  soft: text('한쪽을 고른 문항도 있지만, 강도와 중간 응답을 함께 보면 이번 기준에서는 뚜렷한 차이로 분류하지 않았어요. 중립 구간은 이 수업 활동을 위한 표시 기준이에요.', 'Some answers favored one side, but their intensity and the midpoint responses did not produce a clear difference under this activity’s display rule. The neutral band is a classroom convention.'),
};

export function mixedPattern(axis: AxisSummary) {
  if (axis.responses.midpoint === axis.total) return 'midpoint' as const;
  if (axis.responses.l > 0 && axis.responses.m > 0) return 'opposed' as const;
  return 'soft' as const;
}
export function readingFor(axis: AxisSummary) {
  return axisReadings[axis.id][axis.zone ?? 'X'];
}
export function combinationFor(result: Result): Text | null {
  return result.profileCode ? combinationReadings[result.profileCode] ?? null : null;
}
