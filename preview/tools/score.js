// score.js - messeze.com/check.html 의 analyze() 원본 (2026-11-05 추출). 로컬 프리뷰 채점용
function analyze(html,baseUrl,robots,sitemap,via){
  const doc=new DOMParser().parseFromString(html,'text/html');
  const items=[]; // {cat,label,desc,pts,max,state:ok/no/warn}
  const add=(cat,label,pass,max,desc,warn)=>{items.push({cat,label,desc,max,pts:pass?max:(warn?Math.round(max/2):0),state:pass?'ok':(warn?'warn':'no')})};

  /* ---- A. 콘텐츠 SEO (30) ---- */
  const titles=doc.querySelectorAll('title');
  const title=titles[0]?titles[0].textContent.trim():'';
  add('콘텐츠 SEO','타이틀 태그',!!title,5,title?('"'+title.slice(0,60)+(title.length>60?'…':'')+'"'):'title 태그가 없습니다. 검색결과 제목이 비어 보입니다.');
  add('콘텐츠 SEO','타이틀 단일 사용',titles.length===1,2,titles.length===1?'페이지당 1개 — 정상':'title 태그가 '+titles.length+'개 발견됐습니다.');
  const desc=doc.querySelector('meta[name="description"]');
  const descTxt=desc?(desc.getAttribute('content')||'').trim():'';
  add('콘텐츠 SEO','메타 디스크립션',!!descTxt,5,descTxt?('길이 '+descTxt.length+'자'):'검색결과 설명문이 없습니다. 클릭률에 직접 영향을 줍니다.');
  const h1s=doc.querySelectorAll('h1');
  add('콘텐츠 SEO','H1 태그 존재',h1s.length>0,5,h1s.length?('"'+(h1s[0].textContent.trim().slice(0,50))+'"'):'페이지 대표 제목(H1)이 없습니다.');
  add('콘텐츠 SEO','H1 단일 사용',h1s.length===1,2,h1s.length===1?'페이지당 1개 — 정상':(h1s.length===0?'H1이 없어 판정 불가':'H1이 '+h1s.length+'개입니다. 1개로 정리하세요.'),h1s.length===0);
  const h2s=doc.querySelectorAll('h2');
  add('콘텐츠 SEO','H2 구조화',h2s.length>0,3,h2s.length?('H2 '+h2s.length+'개로 콘텐츠가 구조화되어 있습니다'):'소제목(H2)이 없습니다. AI와 검색엔진이 문서 구조를 읽기 어렵습니다.');
  // 헤딩 계층
  let hier=true,last=0;
  doc.querySelectorAll('h1,h2,h3,h4,h5,h6').forEach(h=>{const lv=+h.tagName[1];if(last&&lv>last+1)hier=false;last=lv;});
  add('콘텐츠 SEO','제목 태그 계층 구조',hier,3,hier?'H1→H2→H3 순서 준수':'헤딩 레벨을 건너뛰는 구간이 있습니다 (예: H1→H3).');
  const imgs=[...doc.querySelectorAll('img')];
  const noAlt=imgs.filter(i=>!(i.getAttribute('alt')||'').trim()).length;
  add('콘텐츠 SEO','이미지 ALT 속성',imgs.length>0&&noAlt===0,3,imgs.length===0?'이미지가 없어 판정 제외 (통과 처리)':(noAlt===0?'전체 '+imgs.length+'개 이미지에 ALT 있음':noAlt+'/'+imgs.length+'개 이미지에 ALT가 없습니다.'),imgs.length===0);

  /* ---- B. 기술적 SEO (12) ---- */
  add('기술적 SEO','HTTPS 보안',baseUrl.startsWith('https'),3,baseUrl.startsWith('https')?'SSL 적용됨':'HTTP로 접속됩니다. SSL 인증서를 적용하세요.');
  add('기술적 SEO','Canonical 태그',!!doc.querySelector('link[rel="canonical"]'),2,doc.querySelector('link[rel="canonical"]')?'대표 URL 명시됨':'중복 콘텐츠 방지를 위한 canonical이 없습니다.');
  add('기술적 SEO','Viewport 설정',!!doc.querySelector('meta[name="viewport"]'),2,doc.querySelector('meta[name="viewport"]')?'모바일 대응 선언됨':'모바일 우선 인덱싱 대응이 없습니다.');
  const langAttr=/<html[^>]+lang=/i.test(html);
  add('기술적 SEO','언어 속성 (lang)',langAttr,2,langAttr?'콘텐츠 언어 명시됨':'html lang 속성이 없습니다.');
  const hasDoctype=/^\s*<!doctype html/i.test(html)||via==='jina';
  add('기술적 SEO','DOCTYPE 선언',hasDoctype,1,via==='jina'?'렌더링 프록시 경유 — 판정 제외 (통과 처리)':(hasDoctype?'HTML5 표준':'DOCTYPE 선언이 없습니다.'));
  const og=doc.querySelectorAll('meta[property^="og:"]').length;
  add('기술적 SEO','Open Graph 태그',og>=3,2,og?('OG 태그 '+og+'개'):'SNS 공유·네이버 사이트명 표시용 OG 태그가 없습니다.',og>0&&og<3);

  /* ---- C. 크롤링 준비 (8) ---- */
  add('크롤링 준비','파비콘',!!doc.querySelector('link[rel*="icon"]'),1,doc.querySelector('link[rel*="icon"]')?'선언됨':'브라우저 탭·검색결과 아이콘이 없습니다.');
  add('크롤링 준비','robots.txt',robots.ok&&robots.text.toLowerCase().includes('user-agent'),2,robots.ok?(robots.text.toLowerCase().includes('user-agent')?'유효한 규칙 확인':'파일은 있으나 User-agent 규칙이 없습니다.'):'robots.txt가 없습니다. 크롤러 접근 제어가 안 됩니다.',robots.ok&&!robots.text.toLowerCase().includes('user-agent'));
  add('크롤링 준비','sitemap.xml',sitemap.ok&&sitemap.text.includes('<url'),3,sitemap.ok?(sitemap.text.includes('<url')?'유효한 사이트맵 확인':'파일은 있으나 URL 목록이 없습니다.'):'sitemap.xml이 없습니다. 검색엔진이 사이트 구조를 파악하기 어렵습니다.',sitemap.ok&&!sitemap.text.includes('<url'));

  /* ---- C2. 속도·기술 최적화 (4) ---- */
  const mixed=baseUrl.startsWith('https')?[...doc.querySelectorAll('img[src],script[src],link[href]')].filter(el=>/^http:\/\//i.test(el.getAttribute('src')||el.getAttribute('href')||'')).length:0;
  add('속도·기술 최적화','혼합 콘텐츠 없음',mixed===0,1,!baseUrl.startsWith('https')?'HTTP 페이지 — 판정 제외 (통과 처리)':(mixed?mixed+'개 리소스가 http로 로드됩니다. HTTPS에서 차단·경고될 수 있습니다.':'모든 리소스가 https로 로드됩니다 — 정상'));
  const lazyN=imgs.filter(i=>(i.getAttribute('loading')||'').toLowerCase()==='lazy').length;
  add('속도·기술 최적화','이미지 지연 로딩',imgs.length===0||lazyN>0,1,imgs.length===0?'이미지 없음 — 판정 제외 (통과 처리)':(lazyN?lazyN+'/'+imgs.length+'개 이미지에 lazy 로딩 적용':'loading="lazy"가 없어 초기 로딩이 무거워질 수 있습니다.'),imgs.length>0&&lazyN>0&&lazyN<imgs.length);
  const nextGen=[...doc.querySelectorAll('img,source')].some(el=>/\.(webp|avif)([?#\s]|$)/i.test((el.getAttribute('src')||'')+' '+(el.getAttribute('srcset')||''))||/image\/(webp|avif)/i.test(el.getAttribute('type')||''));
  add('속도·기술 최적화','차세대 이미지 포맷',imgs.length===0||nextGen,1,imgs.length===0?'이미지 없음 — 판정 제외 (통과 처리)':(nextGen?'WebP/AVIF 사용 확인':'JPG/PNG만 쓰고 있습니다. WebP로 바꾸면 용량이 줄어 속도가 개선됩니다.'));
  const hints=doc.querySelectorAll('link[rel="preconnect"],link[rel="preload"],link[rel="dns-prefetch"],link[rel="prefetch"]').length;
  add('속도·기술 최적화','리소스 힌트',hints>0,1,hints?('preconnect·preload 등 '+hints+'개 적용'):'외부 자원 연결을 앞당기는 리소스 힌트(preconnect 등)가 없습니다.');

  /* ---- D. 구조화 데이터 (30) ---- */
  const ldNodes=[...doc.querySelectorAll('script[type="application/ld+json"]')];
  let lds=[],ldValid=ldNodes.length>0;
  ldNodes.forEach(n=>{try{const p=JSON.parse(n.textContent);(Array.isArray(p)?p:(p['@graph']||[p])).forEach(o=>lds.push(o));}catch(e){ldValid=false;}});
  const types=lds.map(o=>String(o['@type']||'')).flat();
  const hasType=t=>types.some(x=>x.toLowerCase().includes(t.toLowerCase()));
  add('구조화 데이터','JSON-LD 존재',ldNodes.length>0,8,ldNodes.length?('스크립트 '+ldNodes.length+'개, 엔티티 '+lds.length+'개'):'구조화 데이터가 전혀 없습니다. AI가 발행 주체를 식별할 수 없습니다.');
  add('구조화 데이터','JSON-LD 문법 유효',ldNodes.length>0&&ldValid,4,ldNodes.length===0?'JSON-LD가 없어 판정 불가':(ldValid?'파싱 정상':'JSON 문법 오류가 있습니다.'));
  add('구조화 데이터','발행 주체 (Organization)',hasType('Organization')||hasType('LocalBusiness')||hasType('Corporation'),6,(hasType('Organization')||hasType('LocalBusiness'))?'조직 엔티티 선언됨':'누가 만든 페이지인지 AI가 알 수 없습니다. Organization 스키마를 추가하세요.');
  add('구조화 데이터','WebSite · WebPage',hasType('WebSite')||hasType('WebPage'),4,(hasType('WebSite')||hasType('WebPage'))?'사이트·페이지 엔티티 선언됨':'WebSite/WebPage 엔티티가 없습니다.');
  add('구조화 데이터','이동경로 (BreadcrumbList)',hasType('Breadcrumb'),3,hasType('Breadcrumb')?'선언됨':'페이지 위치 맥락을 알려주는 BreadcrumbList가 없습니다.');
  const pageSchema=['Article','Product','Service','FAQPage','NewsArticle','BlogPosting','Offer'].some(t=>hasType(t));
  add('구조화 데이터','페이지 유형 스키마',pageSchema,5,pageSchema?'콘텐츠 유형 스키마 확인 (Article/Service/FAQ 등)':'페이지 성격을 알리는 유형 스키마(Article·Service·FAQPage 등)가 없습니다.');

  /* ---- E. 엔티티 연결성 (10) ---- */
  const idCnt=lds.filter(o=>o['@id']).length;
  add('엔티티 연결성','@id 식별자',lds.length>0&&idCnt>0,5,lds.length===0?'엔티티가 없어 판정 불가':(idCnt?idCnt+'개 엔티티에 @id 부여':'엔티티에 @id가 없어 상호 연결을 인식하기 어렵습니다.'));
  const sameAs=lds.some(o=>o.sameAs&&(Array.isArray(o.sameAs)?o.sameAs.length:1));
  add('엔티티 연결성','sameAs 외부 연결',sameAs,5,sameAs?'외부 프로필 연결 확인':'SNS·외부 프로필과의 sameAs 연결이 없습니다. AI가 외부 지식과 연결하지 못합니다.');

  /* ---- F. AI 읽기 용이성 (10) ---- */
  const bodyText=(doc.body?doc.body.textContent:'').replace(/\s+/g,' ').trim();
  add('AI 읽기 용이성','본문 텍스트 충분성',bodyText.length>=1500,4,'서버 응답 기준 본문 '+bodyText.length.toLocaleString()+'자'+(bodyText.length>=1500?'':' — AI가 읽을 텍스트가 부족합니다. CSR(자바스크립트 렌더링)이라면 서버 렌더링을 검토하세요.'),bodyText.length>=500&&bodyText.length<1500);
  const faqLike=hasType('FAQPage')||[...doc.querySelectorAll('h2,h3')].some(h=>/[?？]|무엇|어떻게|왜|인가요|하나요/.test(h.textContent));
  add('AI 읽기 용이성','질문형 콘텐츠',faqLike,3,faqLike?'Q&A형 구조 확인 — AI 인용에 유리':'고객 질문에 답하는 Q&A형 콘텐츠가 없습니다.');
  const wordTitle=title.length>=15&&title.length<=60;
  add('AI 읽기 용이성','타이틀 최적 길이',wordTitle,3,title?('현재 '+title.length+'자 (권장 15~60자)'):'타이틀이 없습니다.',title.length>0&&!wordTitle);

  return items;
}
window.__analyze=analyze;
