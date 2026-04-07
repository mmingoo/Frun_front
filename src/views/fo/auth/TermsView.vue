<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.js'

const router = useRouter()
const auth = useAuthStore()

const agreeService = ref(false)
const agreePrivacy = ref(false)
const agreeMarketing = ref(false)

const agreeAll = computed(
  () => agreeService.value && agreePrivacy.value && agreeMarketing.value,
)

const canNext = computed(() => agreeService.value && agreePrivacy.value)

function toggleAll() {
  const next = !agreeAll.value
  agreeService.value = next
  agreePrivacy.value = next
  agreeMarketing.value = next
}

const openService = ref(false)
const openPrivacy = ref(false)
const openMarketing = ref(false)

function handleNext() {
  if (!canNext.value) return
  auth.termsAgreed = true
  auth.marketingAgreed = agreeMarketing.value
  router.push('/signup/nickname')
}
</script>

<template>
  <div class="terms-wrap">
    <div class="terms-card">
      <!-- 로고 -->
      <div class="logo-area">
        <div class="logo-icon">
          <svg
            width="28"
            height="28"
            viewBox="-2 0 24 20"
            fill="none"
            stroke="#3b5bdb"
            stroke-width="2.2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M13 4a1 1 0 1 0 2 0 1 1 0 0 0-2 0" />
            <path d="M7.5 15.5 9 11l3 2 2-5" />
            <path d="M4 19l3.5-3.5" />
          </svg>
        </div>
        <h1 class="brand">FRun</h1>
      </div>

      <h2 class="page-title">서비스 이용약관</h2>
      <p class="page-subtitle">FRun 서비스 이용을 위해 약관에 동의해주세요.</p>

      <!-- 전체 동의 -->
      <label class="agree-all-row" :class="{ checked: agreeAll }">
        <input type="checkbox" :checked="agreeAll" class="agree-checkbox" @change="toggleAll" />
        <span class="agree-all-label">전체 동의</span>
      </label>

      <div class="divider" />

      <!-- [필수] 서비스 이용약관 -->
      <div class="term-item">
        <div class="term-header">
          <label class="term-check-label">
            <input type="checkbox" v-model="agreeService" class="agree-checkbox" />
            <span class="badge required">필수</span>
            <span class="term-title">서비스 이용약관 동의</span>
          </label>
          <button class="btn-toggle" @click="openService = !openService">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              :style="{ transform: openService ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }"
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>
        </div>
        <div v-if="openService" class="term-content">
          <p><strong>제1조(목적)</strong><br />
이 약관은 FRun (이하 '회사' 라고 합니다)가 제공하는 제반 서비스의 이용과 관련하여 회사와 회원과의 권리, 의무 및 책임사항, 기타 필요한 사항을 규정함을 목적으로 합니다.</p>
          <p><strong>제2조(정의)</strong><br />
이 약관에서 사용하는 주요 용어의 정의는 다음과 같습니다.<br />
1. '서비스'라 함은 구현되는 단말기와 상관없이 이용자가 이용할 수 있는 회사가 제공하는 제반 서비스를 의미합니다.<br />
2. '이용자'란 이 약관에 따라 회사가 제공하는 서비스를 받는 '개인회원', '기업회원' 및 '비회원'을 말합니다.<br />
3. '개인회원'은 회사에 개인정보를 제공하여 회원등록을 한 사람으로, 회사로부터 지속적으로 정보를 제공받고 서비스를 계속적으로 이용할 수 있는 자를 말합니다.<br />
4. '기업회원'은 회사에 기업정보 및 개인정보를 제공하여 회원등록을 한 사람으로, 회사로부터 지속적으로 정보를 제공받고 서비스를 계속적으로 이용할 수 있는 자를 말합니다.<br />
5. '비회원'은 회원가입 없이 회사가 제공하는 서비스를 이용하는 자를 말합니다.<br />
6. '아이디(ID)'라 함은 회원의 식별과 서비스이용을 위하여 회원이 정하고 회사가 승인하는 문자 또는 문자와 숫자의 조합을 의미합니다.<br />
7. '비밀번호'라 함은 회원임을 확인하고 비밀의 보호를 위해 회원 자신이 정한 문자(특수문자 포함)와 숫자의 조합을 의미합니다.<br />
8. '콘텐츠'란 정보통신망에서 사용되는 부호·문자·음성·음향·이미지 또는 영상 등으로 정보 형태의 글, 사진, 동영상 및 각종 파일과 링크 등을 말합니다.</p>
          <p><strong>제3조(약관 외 준칙)</strong><br />
이 약관에서 정하지 아니한 사항에 대해서는 법령 또는 회사가 정한 서비스의 개별약관, 운영정책 및 규칙 등의 규정에 따릅니다. 본 약관과 세부지침이 충돌할 경우에는 세부지침에 따릅니다.</p>
          <p><strong>제4조(약관의 효력과 변경)</strong><br />
1. 이 약관은 FRun이 제공하는 모든 인터넷서비스에 게시하여 공시합니다. 회사는 관계 법령에 위배되지 않는 범위 내에서 이 약관을 변경할 수 있으며, 변경 시 그 시행일로부터 최소 7일(불리하거나 중대한 사항은 30일) 이전부터 공지합니다.<br />
2. 이용자가 변경된 약관에 대해 거절의 의사를 표시하지 않았을 때에는 변경에 동의한 것으로 간주합니다.</p>
          <p><strong>제5조(이용자에 대한 통지)</strong><br />
1. 회사는 이용자에게 전자우편, 문자메시지(SMS), 푸쉬(Push)알림 등의 전자적 수단을 이용하여 통지할 수 있습니다.<br />
2. 회사는 이용자 전체에 대한 통지의 경우 7일 이상 웹사이트 내의 게시판에 게시함으로써 개별 통지에 갈음할 수 있습니다.</p>
          <p><strong>제6조(이용계약의 체결)</strong><br />
이용계약은 이용자가 약관의 내용에 대하여 동의를 한 다음 회원가입신청을 하고 회사가 이러한 신청에 대하여 승낙한 때 체결됩니다.</p>
          <p><strong>제7조(회원가입에 대한 승낙)</strong><br />
1. 회사는 이용계약에 대한 요청이 있을 때 서비스 이용을 승낙함을 원칙으로 합니다.<br />
2. 이전에 회원자격을 상실한 경우, 실명이 아니거나 타인의 명의를 도용한 경우, 필수정보를 누락하거나 허위로 기재한 경우, 만 14세 미만의 아동이 법정대리인의 동의를 얻지 않은 경우 등에 해당하면 회원가입을 보류하거나 거절할 수 있습니다.</p>
          <p><strong>제8조(회원정보의 변경)</strong><br />
1. 회원은 개인정보관리화면을 통하여 언제든지 본인의 개인정보를 열람하고 수정할 수 있습니다.<br />
2. 회원은 가입신청 시 기재한 사항이 변경되었을 경우 온라인으로 수정하거나 회사에 변경사항을 알려야 합니다.</p>
          <p><strong>제9조(회원정보의 관리 및 보호)</strong><br />
1. 회원의 아이디(ID)와 비밀번호에 관한 관리책임은 회원에게 있으며, 이를 제3자가 이용하도록 하여서는 안 됩니다.<br />
2. 아이디(ID) 및 비밀번호가 도용되거나 제3자가 사용하고 있음을 인지한 경우에는 즉시 회사에 통지하고 안내에 따라야 합니다.</p>
          <p><strong>제10조(회사의 의무)</strong><br />
회사는 계속적이고 안정적인 서비스의 제공을 위하여 설비에 장애가 생기거나 멸실된 때에는 이를 지체 없이 수리 또는 복구하며, 부득이한 경우 예고 없이 서비스의 전부 또는 일부의 제공을 일시 중지할 수 있습니다.</p>
          <p><strong>제11조(개인정보보호)</strong><br />
회사는 이용자들의 개인정보를 중요시하며, 관련 법규를 준수하기 위해 노력합니다. 개인정보 수집·이용에 관한 자세한 사항은 개인정보처리방침을 확인해주세요.</p>
          <p><strong>제12조(이용자의 의무)</strong><br />
1. 이용자는 사실에 근거하여 신청서를 작성해야 합니다.<br />
2. 이용자는 본 약관에서 규정하는 사항과 회사가 공지하는 사항을 준수하여야 합니다.<br />
3. 이용자는 회원정보가 변경된 경우 즉시 온라인을 통해 수정해야 합니다.</p>
          <p><strong>제13조(서비스의 제공)</strong><br />
1. 회사의 서비스는 연중무휴, 1일 24시간 제공을 원칙으로 합니다.<br />
2. 회사가 제공하는 서비스: 웹페이지 등을 활용하여 제공되는 서비스, 네이버 소셜 로그인을 활용한 간편 로그인 서비스.</p>
          <p><strong>제14조(서비스의 제한 등)</strong><br />
회사는 천재지변 또는 이에 준하는 국가비상사태 등 부득이한 사유가 있는 경우에는 서비스의 전부 또는 일부를 제한하거나 중지할 수 있습니다.</p>
          <p><strong>제15조(서비스의 해제·해지 및 탈퇴 절차)</strong><br />
1. 이용자가 이용 계약을 해지하고자 할 때는 언제든지 홈페이지 상의 탈퇴 신청을 통해 이용계약 해지를 요청할 수 있습니다.<br />
2. 회사는 이용자가 본 약관을 위반한 경우 이용자에게 통지하고, 계약을 해지할 수 있습니다.</p>
          <p><strong>제16조(손해배상)</strong><br />
회사 또는 이용자는 상대방의 귀책에 따라 손해가 발생하는 경우 손해배상을 청구할 수 있습니다. 다만, 회사는 무료서비스의 장애, 제공 중단 등으로 인한 손해에 대하여는 배상책임을 부담하지 않습니다.</p>
          <p><strong>제17조(면책사항)</strong><br />
1. 회사는 천재지변 또는 이에 준하는 불가항력으로 인하여 서비스를 제공할 수 없는 경우 책임을 지지 않습니다.<br />
2. 회사는 이용자의 귀책사유로 인한 서비스 이용장애에 대하여 책임을 지지 않습니다.<br />
3. 회사는 이용자가 서비스를 이용하며 기대하는 수익을 얻지 못한 것에 대하여 책임 지지 않습니다.</p>
          <p><strong>제18조(정보의 제공 및 광고의 게재)</strong><br />
마케팅 정보 수신에 관한 자세한 사항은 마케팅 정보 수신 동의 항목을 확인해주세요.</p>
          <p><strong>제19조(권리의 귀속)</strong><br />
1. 회사가 제공하는 서비스에 대한 저작권 등 지식재산권은 회사에 귀속됩니다.<br />
2. 이용자는 서비스 이용 권한을 양도, 판매, 담보제공 하는 등 처분행위를 할 수 없습니다.<br />
3. 이용자가 직접 작성한 콘텐츠에 대한 지식재산권은 회사에 귀속되지 않습니다.</p>
          <p><strong>제20조(콘텐츠의 관리)</strong><br />
회원이 작성한 콘텐츠가 관련 법에 위반되는 내용을 포함하는 경우, 회사는 관련 법이 정한 절차에 따라 해당 콘텐츠의 게시중단 및 삭제 등의 조치를 취하여야 합니다.</p>
          <p><strong>제21조(콘텐츠의 저작권)</strong><br />
1. 이용자가 서비스 내에 게시한 콘텐츠의 저작권은 해당 콘텐츠의 저작자에게 귀속됩니다.<br />
2. 회사는 서비스의 운영, 홍보 등의 목적으로 별도의 허락 없이 무상으로 회원이 등록한 콘텐츠를 사용할 수 있습니다.</p>
          <p><strong>제22조(관할법원 및 준거법)</strong><br />
서비스와 관련하여 분쟁이 발생한 경우 관할법원은 회사 소재지 관할법원으로 정하며, 준거법은 대한민국의 법령을 적용합니다.</p>
          <p><strong>부칙</strong><br />제1조(시행일) 본 약관은 2026.04.24.부터 시행됩니다.</p>
        </div>
      </div>

      <!-- [필수] 개인정보처리방침 -->
      <div class="term-item">
        <div class="term-header">
          <label class="term-check-label">
            <input type="checkbox" v-model="agreePrivacy" class="agree-checkbox" />
            <span class="badge required">필수</span>
            <span class="term-title">개인정보처리방침 동의</span>
          </label>
          <button class="btn-toggle" @click="openPrivacy = !openPrivacy">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              :style="{ transform: openPrivacy ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }"
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>
        </div>
        <div v-if="openPrivacy" class="term-content">
          <p><strong>개인정보처리방침 (제11조 관련)</strong></p>
          <p>회사는 이용자들의 개인정보를 중요시하며, 정보통신망 이용촉진 및 정보보호 등에 관한 법률, 개인정보보호법 등 관련 법규를 준수하기 위해 노력합니다.</p>
          <p><strong>1. 수집하는 개인정보 항목</strong><br />
회사는 소셜 로그인(네이버 등) 서비스를 통해 이용자의 이름, 이메일 주소, 전화번호를 제공받을 수 있습니다.</p>
          <p><strong>2. 개인정보의 수집 및 이용 목적</strong><br />
수집된 정보는 회원 식별 및 서비스 제공 목적으로만 이용됩니다.</p>
          <p><strong>3. 개인정보의 보유 및 이용 기간</strong><br />
회원 탈퇴 시까지 보유하며, 탈퇴 후에는 관련 법령에 따라 일정 기간 보관 후 파기합니다.</p>
          <p><strong>4. 개인정보의 제3자 제공</strong><br />
회사는 이용자의 개인정보를 원칙적으로 외부에 제공하지 않습니다. 다만, 이용자의 동의가 있거나 법령의 규정에 의한 경우에는 예외로 합니다.</p>
          <p><strong>5. 개인정보 처리의 위탁</strong><br />
회사는 서비스 제공을 위해 필요한 경우 개인정보 처리를 외부에 위탁할 수 있으며, 위탁 시 관련 법령에 따라 안전하게 관리합니다.</p>
          <p><strong>6. 이용자의 권리</strong><br />
이용자는 해당 소셜 서비스의 계정 설정 또는 회사에 대한 별도 요청을 통해 제공 항목을 변경하거나 제한할 수 있습니다.</p>
          <p><strong>7. 개인정보 보호책임자</strong><br />
개인정보 관련 문의사항은 서비스 내 고객센터를 통해 접수하실 수 있습니다.</p>
        </div>
      </div>

      <!-- [선택] 마케팅 수신 동의 -->
      <div class="term-item">
        <div class="term-header">
          <label class="term-check-label">
            <input type="checkbox" v-model="agreeMarketing" class="agree-checkbox" />
            <span class="badge optional">선택</span>
            <span class="term-title">마케팅 정보 수신 동의</span>
          </label>
          <button class="btn-toggle" @click="openMarketing = !openMarketing">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              :style="{ transform: openMarketing ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }"
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>
        </div>
        <div v-if="openMarketing" class="term-content">
          <p><strong>마케팅 정보 수신 동의 (제18조 관련)</strong></p>
          <p>회사는 이용자가 서비스 이용 중 필요하다고 인정되는 각종 정보 및 광고를 배너 게재, 전자우편(E-Mail), 휴대폰 메시지, 전화, 우편 등의 방법으로 이용자에게 제공(또는 전송)할 수 있습니다.</p>
          <p><strong>수신 동의 항목</strong><br />
- 이벤트 및 프로모션 안내<br />
- 신규 서비스 및 기능 안내<br />
- 맞춤형 러닝 콘텐츠 및 챌린지 정보<br />
- 친구 활동 및 커뮤니티 소식</p>
          <p><strong>수신 방법</strong><br />
전자우편(E-Mail), 휴대폰 문자메시지(SMS/MMS), 앱 푸쉬(Push) 알림</p>
          <p><strong>수신 거부 안내</strong><br />
이용자는 마케팅 정보 수신을 원하지 않을 경우 회사가 제공하는 방법(서비스 내 설정, 전자우편 수신 거부 링크 등)에 따라 언제든지 수신을 거부할 수 있습니다.</p>
          <p><strong>수신 동의 확인</strong><br />
회사는 정보통신망법 시행령에 따라 2년마다 영리 목적의 광고성 정보 전송에 대한 수신동의 여부를 확인합니다.</p>
          <p>※ 마케팅 정보 수신 동의는 선택사항이며, 동의하지 않아도 서비스 이용에는 제한이 없습니다.</p>
        </div>
      </div>

      <!-- 다음 버튼 -->
      <button class="btn-next" :disabled="!canNext" @click="handleNext">다음</button>
    </div>
  </div>
</template>

<style scoped src="./TermsView.css" />
