'use client'

import { Dialog, DialogContent } from '@/components/ui/dialog'
import { apiGet } from '@/lib/api'
import { getCurrentExploerUrl } from '@/lib/config'
import { useSafe } from '@/lib/hooks/useSafe'
import { MATCH_SUCCESS, PREPARE_SEND_SUCCESS, TradePair, TxTaskStatus } from '@/lib/types'
import { cn, displayBn, parseBn, sleep } from '@/lib/utils'
import { Share2Icon } from '@radix-ui/react-icons'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { useCallback, useMemo, useState } from 'react'
import { useInterval } from 'usehooks-ts'
import { Button } from './ui/button'
import { Pagination } from 'swiper/modules'
import { Swiper, SwiperSlide } from 'swiper/react'

function StepDot({ active }: { active: boolean }) {
  return (
    <div
      className={cn('w-5 h-5 shrink-0')}
      style={
        active
          ? {
              borderRadius: 90,
              // border: '3px solid rgba(255, 172, 3, 0.2)',
              background: 'linear-gradient(180deg, #FFCF6D 0%, #FFAC03 100%)',
            }
          : {
              borderRadius: 90,
              // border: '3px solid rgba(86, 71, 40, 0.2)',
              background: '#564728',
            }
      }
    />
  )
}

function StepArrow({ active }: { active: boolean }) {
  const color = active ? '#FFAC03' : '#564728'
  return (
    <svg xmlns='http://www.w3.org/2000/svg' width='106' height='5' viewBox='0 0 106 5' fill={color}>
      <defs>
        <linearGradient id='grad1' x1='0%' y1='0%' x2='100%' y2='0%'>
          <stop offset='0%' stopColor='#ffab03be' stopOpacity={0.1} />
          <stop offset='100%' stopColor='#FFAC03' stopOpacity={1} />
        </linearGradient>
        <linearGradient id='grad2' x1='0%' y1='0%' x2='100%' y2='0%'>
          <stop offset='0%' stopColor='#5647289a' stopOpacity={0.1} />
          <stop offset='100%' stopColor='#564728' stopOpacity={1} />
        </linearGradient>
      </defs>
      <path d='M0 2L100 2L100 3L-4.37116e-08 3L0 2Z' fill={active ? 'url(#grad1)' : 'url(#grad2)'} />
      <path d='M100 -2.62268e-07L106 2.46667L100 5L100 -2.62268e-07Z' />
    </svg>
  )
}

function Step3({ step }: { step: 0 | 1 | 2 }) {
  return (
    <div className='flex flex-row items-center justify-between py-2 w-full'>
      <StepDot active={step >= 0} />
      <StepArrow active={step >= 0} />
      <StepDot active={step >= 1} />
      <StepArrow active={step >= 1} />
      <StepDot active={step >= 2} />
    </div>
  )
}

const initOpacities = [0.1, 0.2, 0.4, 0.6, 0.8, 1]
function LoadArrow({ anim, position }: { anim: boolean; position: '>>' | '<<' }) {
  const [opacities, setOpacities] = useState(initOpacities)
  useInterval(() => {
    if (anim)
      setOpacities((old) => {
        return [old[old.length - 1]].concat(old.slice(0, old.length - 1))
      })
    else setOpacities(() => initOpacities)
  }, 150)

  return (
    <div className='overflow-hidden'>
      <svg
        xmlns='http://www.w3.org/2000/svg'
        width='80'
        height='12'
        viewBox='0 0 80 12'
        fill='blank'
        style={{
          transform: position == '<<' ? 'rotate(180deg)' : 'none',
        }}
        className=''
      >
        <path
          opacity={opacities[0]}
          d='M6.55955 6.74967C6.75044 6.54851 6.85714 6.27968 6.85714 5.9999C6.85714 5.72013 6.75044 5.4513 6.55955 5.25014C4.92853 3.60797 3.30693 1.96221 1.69474 0.312851C1.54479 0.156005 1.34918 0.0525967 1.13695 0.0179799L1.00633 0H0.967496L0.819221 0.0215759C0.629651 0.0514054 0.453131 0.138176 0.312254 0.270783C0.171377 0.403389 0.0725516 0.575799 0.0284264 0.765945C-0.001637 0.914213 -0.001637 1.06718 0.0284264 1.21544C0.0524726 1.35853 0.113387 1.49256 0.204943 1.60381C0.247008 1.65768 0.291786 1.70929 0.339096 1.75844L4.44135 5.94057C4.46157 5.95857 4.48279 5.97538 4.50489 5.99091L4.44488 6.05564L0.459127 10.1083C0.237647 10.2767 0.0804237 10.5182 0.014305 10.7916C-0.00476835 10.9287 -0.00476835 11.0679 0.014305 11.2051C0.0284559 11.2725 0.0509971 11.3377 0.0813814 11.3993C0.145974 11.5504 0.246266 11.683 0.373326 11.7851C0.500385 11.8872 0.650267 11.9558 0.809623 11.9846C0.968979 12.0134 1.13286 12.0017 1.28668 11.9504C1.44049 11.8991 1.57946 11.8098 1.69121 11.6906C3.31046 10.0532 4.93324 8.40622 6.55955 6.74967Z'
        />
        <path
          opacity={opacities[1]}
          d='M21.1302 6.74967C21.3216 6.54851 21.4286 6.27968 21.4286 5.9999C21.4286 5.72013 21.3216 5.4513 21.1302 5.25014C19.5068 3.60797 17.8857 1.96221 16.267 0.312851C16.1157 0.155321 15.9183 0.0518595 15.7042 0.0179799L15.5733 0H15.5343L15.3857 0.0215759C15.1963 0.0520638 15.0201 0.139129 14.8795 0.271686C14.7389 0.404244 14.6404 0.576298 14.5964 0.765945C14.5663 0.914213 14.5663 1.06718 14.5964 1.21544C14.615 1.36251 14.6725 1.5017 14.7627 1.61819C14.8049 1.67206 14.8498 1.72367 14.8972 1.77282L19.0172 5.93338C19.0374 5.95138 19.0587 5.96819 19.0809 5.98372L19.0207 6.04845C17.6922 7.41013 16.3626 8.76342 15.0317 10.1083C14.8097 10.2767 14.6521 10.5182 14.5858 10.7916C14.5667 10.9287 14.5667 11.0679 14.5858 11.2051C14.6 11.2725 14.6226 11.3377 14.653 11.3993C14.7178 11.5504 14.8183 11.683 14.9457 11.7851C15.0731 11.8872 15.2234 11.9558 15.3831 11.9846C15.5429 12.0134 15.7072 12.0017 15.8614 11.9504C16.0156 11.8991 16.155 11.8098 16.267 11.6906C17.8881 10.046 19.5091 8.40023 21.1302 6.75326V6.74967Z'
        />
        <path
          opacity={opacities[2]}
          d='M35.6967 6.75756C35.891 6.5578 36 6.28813 36 6.00711C36 5.7261 35.891 5.45643 35.6967 5.25667C34.074 3.62063 32.4549 1.97273 30.8392 0.312982C30.6888 0.155819 30.4926 0.0522747 30.2797 0.0177831L30.1468 0H30.1083L29.9579 0.0213397C29.7685 0.051399 29.5922 0.138153 29.4514 0.27054C29.3106 0.402927 29.2118 0.574949 29.1676 0.764671C29.1377 0.912504 29.1377 1.06497 29.1676 1.2128C29.1923 1.35578 29.2539 1.48955 29.3459 1.60047C29.3888 1.65382 29.4343 1.70486 29.4823 1.75341L33.5844 5.94665C33.6044 5.96445 33.6255 5.98108 33.6474 5.99644L33.5879 6.06046L29.6047 10.1114C29.3822 10.2795 29.224 10.5208 29.1571 10.7943C29.1381 10.9312 29.1381 11.07 29.1571 11.2069C29.1712 11.2735 29.1935 11.338 29.2235 11.3989C29.2882 11.5501 29.3885 11.6827 29.5158 11.7849C29.643 11.8871 29.7931 11.9557 29.9527 11.9846C30.1123 12.0134 30.2765 12.0017 30.4305 11.9504C30.5846 11.8991 30.7238 11.8098 30.8357 11.6906C32.456 10.0474 34.074 8.40308 35.6897 6.75756H35.6967Z'
        />
        <path
          opacity={opacities[3]}
          d='M50.2681 6.75756C50.4624 6.5578 50.5714 6.28813 50.5714 6.00711C50.5714 5.7261 50.4624 5.45643 50.2681 5.25667C48.6454 3.62063 47.0263 1.97273 45.4106 0.312982C45.2603 0.155819 45.064 0.0522747 44.8511 0.0177831L44.7182 0H44.6797L44.5294 0.0213397C44.3399 0.051399 44.1636 0.138153 44.0228 0.27054C43.8821 0.402927 43.7833 0.574949 43.739 0.764671C43.7092 0.912504 43.7092 1.06497 43.739 1.2128C43.7638 1.35578 43.8253 1.48955 43.9174 1.60047C43.9602 1.65382 44.0057 1.70486 44.0538 1.75341L48.1558 5.94665C48.1759 5.96445 48.1969 5.98108 48.2188 5.99644L48.1593 6.06046L44.1762 10.1114C43.9537 10.2795 43.7954 10.5208 43.7285 10.7943C43.7095 10.9312 43.7095 11.07 43.7285 11.2069C43.7427 11.2735 43.765 11.338 43.795 11.3989C43.8596 11.5501 43.96 11.6827 44.0872 11.7849C44.2144 11.8871 44.3645 11.9557 44.5241 11.9846C44.6837 12.0134 44.8479 12.0017 45.002 11.9504C45.156 11.8991 45.2952 11.8098 45.4071 11.6906C47.0275 10.0474 48.6454 8.40308 50.2611 6.75756H50.2681Z'
        />
        <path
          opacity={opacities[4]}
          d='M64.8395 6.75756C65.0339 6.5578 65.1429 6.28813 65.1429 6.00711C65.1429 5.7261 65.0339 5.45643 64.8395 5.25667C63.2169 3.62063 61.5977 1.97273 59.9821 0.312982C59.8317 0.155819 59.6354 0.0522747 59.4225 0.0177831L59.2896 0H59.2512L59.1008 0.0213397C58.9114 0.051399 58.735 0.138153 58.5943 0.27054C58.4535 0.402927 58.3547 0.574949 58.3105 0.764671C58.2806 0.912504 58.2806 1.06497 58.3105 1.2128C58.3352 1.35578 58.3967 1.48955 58.4888 1.60047C58.5316 1.65382 58.5772 1.70486 58.6252 1.75341L62.7273 5.94665C62.7473 5.96445 62.7683 5.98108 62.7902 5.99644L62.7308 6.06046L58.7476 10.1114C58.5251 10.2795 58.3669 10.5208 58.3 10.7943C58.281 10.9312 58.281 11.07 58.3 11.2069C58.3141 11.2735 58.3364 11.338 58.3664 11.3989C58.431 11.5501 58.5314 11.6827 58.6586 11.7849C58.7859 11.8871 58.936 11.9557 59.0956 11.9846C59.2552 12.0134 59.4193 12.0017 59.5734 11.9504C59.7274 11.8991 59.8666 11.8098 59.9786 11.6906C61.5989 10.0474 63.2169 8.40308 64.8325 6.75756H64.8395Z'
        />
        <path
          opacity={opacities[5]}
          d='M79.4109 6.75756C79.6053 6.5578 79.7143 6.28813 79.7143 6.00711C79.7143 5.7261 79.6053 5.45643 79.4109 5.25667C77.7883 3.62063 76.1691 1.97273 74.5535 0.312982C74.4031 0.155819 74.2069 0.0522747 73.9939 0.0177831L73.8611 0H73.8226L73.6722 0.0213397C73.4828 0.051399 73.3064 0.138153 73.1657 0.27054C73.0249 0.402927 72.9261 0.574949 72.8819 0.764671C72.852 0.912504 72.852 1.06497 72.8819 1.2128C72.9066 1.35578 72.9681 1.48955 73.0602 1.60047C73.1031 1.65382 73.1486 1.70486 73.1966 1.75341L77.2987 5.94665C77.3187 5.96445 77.3397 5.98108 77.3616 5.99644L77.3022 6.06046L73.319 10.1114C73.0965 10.2795 72.9383 10.5208 72.8714 10.7943C72.8524 10.9312 72.8524 11.07 72.8714 11.2069C72.8855 11.2735 72.9078 11.338 72.9378 11.3989C73.0024 11.5501 73.1028 11.6827 73.2301 11.7849C73.3573 11.8871 73.5074 11.9557 73.667 11.9846C73.8266 12.0134 73.9907 12.0017 74.1448 11.9504C74.2989 11.8991 74.4381 11.8098 74.55 11.6906C76.1703 10.0474 77.7883 8.40308 79.4039 6.75756H79.4109Z'
        />
      </svg>
    </div>
  )
}

export type ValueType = 'low' | 'mid' | 'large' | 'super'
const ValueTypes: ValueType[] = ['low', 'mid', 'large', 'super']

function PriceItem({
  tit,
  value,
  txHash,
  valueType,
  symbol,
}: {
  tit: string
  txHash?: string
  value?: string
  valueType?: ValueType
  symbol?: string
}) {
  // valueType && (valueType = 'large')
  const TypeValue = () => {
    if (!valueType)
      return (
        <div>
          {value} {symbol}
        </div>
      )
    return (
      <div
        style={{
          position: 'relative',
          padding: 5,
          border: valueType == 'low' ? '1px dashed #797979' : '1px dashed #FFAC03',
          borderRadius: 13,
          height: '100%',
          boxShadow: valueType == 'low' ? '0px 0px 3px 0px #969696' : '0px 0px 3px 0px #FFAC03',
        }}
      >
        <div
          style={{
            height: '100%',
            padding: '0px 9px 6px 27px',
            border: valueType == 'low' ? '1px dashed #797979' : '1px dashed #FFAC03',
            borderRadius: 13,
            boxShadow: valueType == 'low' ? '0px 0px 3px 0px #969696' : '0px 0px 3px 0px #FFAC03',
            fontWeight: 500,
            background:
              valueType == 'low'
                ? 'linear-gradient(18deg, #FFF -26.77%, #5C5C5C 112.53%)'
                : 'linear-gradient(317deg, #FF2E00 10.54%, #FFAC03 60.45%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          <span className='text-lg'>{value}</span>
          {symbol && <span className='text-sm ml-1'>{symbol}</span>}
        </div>
        {valueType == 'super' && <Image src={'/rainbow.gif'} alt='' width={58} height={50} className='absolute -left-6 -top-3' />}
        {valueType == 'large' && (
          <Image src={'/rainbow.png'} alt='' width={58} height={29} className='absolute object-contain -left-8 top-1' />
        )}
        {valueType == 'mid' && <Image src={'/smiling.png'} alt='' width={48} height={40} className='absolute -left-5 -top-2' />}
        {valueType == 'low' && <Image src={'/low.png'} alt='' width={48} height={40} className='absolute -left-5 -top-1' />}
      </div>
    )
  }
  return (
    <div className='flex justify-between items-center w-full text-lg font-medium relative overflow-visible h-[2.5rem]'>
      <div className=''>{tit}</div>
      {value && <TypeValue />}
      {!value && <div className='loading' style={{ fontSize: 30 }} />}
      {txHash && (
        <a
          href={getCurrentExploerUrl() + '/tx/' + txHash}
          target='_blank'
          rel='noreferrer'
          className='text-xs flex items-center gap-2 cursor-pointer text-[#FFAC03] absolute left-0 top-8'
        >
          Verify random number: <Share2Icon />
        </a>
      )}
    </div>
  )
}

export type StepType = {
  step: 0 | 1 | 2
  min: string
  max: string
  count?: string
  price?: string
  priceType?: ValueType
  txHash?: string
}

export type TxStatusProps = {
  type: 'loading' | 'fail' | 'step'
  tp: TradePair
  step?: StepType | StepType[]
  onClose?: (back: boolean) => void
  onRetry?: () => void
}

export function TxStatus({ tp, type, step, onClose, onRetry }: TxStatusProps) {
  const steps = Array.isArray(step) ? step : step ? [step] : []
  const canClose = type == 'fail' || (type == 'step' && steps && steps[0]?.step == 2)
  const wrapClose = (back: boolean) => {
    canClose && onClose && onClose(back)
  }
  const r = useRouter()
  const pathname = usePathname()
  const step0 = type == 'step' ? steps[0] : undefined

  return (
    <Dialog open={true} onOpenChange={() => wrapClose(false)}>
      <DialogContent className='max-w-[450px]' onPointerDownOutside={(e) => e.preventDefault()}>
        <div className='py-0 ' />
        {type == 'loading' && (
          <div className='py-8 px-5 flex flex-col gap-8 items-center'>
            <div>
              <div className='loader2 my-[50px]' style={{ fontSize: 18 }} />
            </div>
            <div className='text-base'>Request account signature</div>
          </div>
        )}
        {type == 'fail' && (
          <div className='py-8 px-5 flex flex-col items-center gap-8'>
            <svg xmlns='http://www.w3.org/2000/svg' width='95' height='95' viewBox='0 0 95 95' fill='none'>
              <path
                d='M80.8906 13.8555C71.9375 4.92136 60.0406 0 47.3803 0C34.7243 0 22.8251 4.92136 13.8794 13.8555C4.92846 22.7945 8.04344e-07 34.6793 8.04344e-07 47.3212C-0.00229763 59.9652 4.92136 71.8474 13.8699 80.7864C22.818 89.7206 34.7171 94.6417 47.3707 94.6417C60.0339 94.6417 71.9375 89.716 80.8906 80.7814C99.3622 62.3335 99.3644 32.3109 80.8906 13.8555ZM76.556 76.4138C68.7668 84.1886 58.4056 88.4782 47.392 88.4782C36.3805 88.4782 26.0267 84.1937 18.2423 76.4233C10.4581 68.6463 6.17052 58.3042 6.17322 47.3022C6.17322 36.2998 10.4604 25.9554 18.2468 18.1834C26.0361 10.4081 36.3849 6.12805 47.3992 6.12805C58.4128 6.12805 68.7667 10.4081 76.556 18.1834C92.6259 34.2392 92.6259 60.3624 76.556 76.4138ZM63.391 31.951C60.3295 31.951 57.8429 34.4261 57.8429 37.4781C57.8429 40.5256 60.3295 43.0028 63.391 43.0028C66.4598 43.0028 68.9419 40.5256 68.9419 37.4781C68.9419 34.426 66.4598 31.951 63.391 31.951ZM33.8532 43.0028C36.9221 43.0028 39.4042 40.5256 39.4042 37.4781C39.4042 34.426 36.9221 31.951 33.8532 31.951C30.7962 31.951 28.3002 34.4261 28.3002 37.4781C28.3002 40.5256 30.794 43.0028 33.8532 43.0028ZM47.4277 55.3062C39.6786 55.3062 32.8429 59.3642 28.7854 65.5774C27.5362 67.4891 28.9059 70.0611 31.1561 70.0611H31.3762C32.2801 70.0611 33.1551 69.6328 33.6665 68.8637C36.6974 64.3234 41.73 61.3539 47.4275 61.3539C53.1558 61.3539 58.2165 64.2809 61.2402 68.8565C61.7492 69.6255 62.6291 70.0587 63.5376 70.0587H63.6748C65.925 70.0633 67.2951 67.4868 66.0436 65.5774C61.9785 59.3759 55.1573 55.3062 47.4277 55.3062Z'
                fill='#808080'
              />
            </svg>
            <div className='text-base'>Request failed</div>
            <Button
              className='w-[160px] h-10 text-lg text-[#ffac03] font-semibold text-center cursor-pointer'
              onClick={() => onRetry && onRetry()}
              style={{
                borderRadius: 100,
                border: '1px solid #ffac03',
                boxShadow: '0px 2px 30px 0px rgba(255, 172, 3, 0.40)',
              }}
            >
              Retry
            </Button>
          </div>
        )}
        {step0 && (
          <div className='w-full'>
            <div className='py-8 px-5 flex flex-col items-center gap-5 w-full'>
              <Step3 step={step0.step} />
              <div className='flex flex-row items-center justify-between w-full'>
                <Image src={'/sse.png'} alt='' width={80} height={80} />
                <div className='flex flex-col gap-2 items-center  text-sm'>
                  <div className={cn(step0.step == 0 ? '' : 'opacity-20')}>requests</div>
                  <LoadArrow anim={step0.step == 0} position='>>' />
                  {step0.step > 0 && <LoadArrow anim={step0.step == 1} position='<<' />}
                  {step0.step > 0 && <div className={step0.step == 1 ? '' : 'opacity-20'}>back</div>}
                </div>
                <Image src={'/chainlink.png'} alt='' width={80} height={80} />
              </div>
            </div>
          </div>
        )}
        {type == 'step' && (
          <Swiper
            spaceBetween={20}
            pagination={
              steps.length > 1 && step0 && step0.step == 2
                ? {
                    clickable: true,
                    renderBullet: function (index, className) {
                      return '<span class="' + className + '">' + (index + 1) + '</span>'
                    },
                  }
                : false
            }
            className='w-full mt-5'
            modules={[Pagination]}
          >
            {steps.map((step, index) => (
              <SwiperSlide className='flex w-full overflow-x-auto gap-2' key={`step_item_${index}`}>
                <div className='flex flex-col items-center gap-5 w-full'>
                  {step.step > 0 && (
                    <div className='flex flex-col gap-2 w-full'>
                      <PriceItem tit='Max price:' value={step.max} symbol={tp.tokenSymbol} />
                      <PriceItem
                        tit='Final price:'
                        value={step.price}
                        symbol={tp.tokenSymbol}
                        valueType={step.priceType}
                        txHash={step.txHash}
                      />
                      <PriceItem tit='Min price:' value={step.min} symbol={tp.tokenSymbol} />
                      <PriceItem tit='Amount:' value={step.count} />
                    </div>
                  )}
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        )}
        {step0 && (
          <div className='w-full px-5 py-5 border-t border-solid border-[#484848] text-center'>
            {step0.step == 0 && <div>Node requests a random number from Chainlink</div>}
            {step0.step == 1 && <div>Wait for Chainlink to back a random number</div>}
            {step0.step == 2 && (
              <div className='flex items-center justify-between'>
                <Button
                  variant='secondary'
                  onClick={() => {
                    if (pathname == '/my') {
                      window.location.reload()
                    } else {
                      r.push('/my')
                    }
                  }}
                >
                  View Profile
                </Button>
                <Button
                  onClick={() => {
                    if (pathname.startsWith('/trade')) {
                      // window.location.reload()
                      wrapClose(true)
                    } else {
                      r.push('/trade')
                    }
                  }}
                >
                  Back to Marketplace
                </Button>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

export function useTxStatus({
  tp,
  onRetry,
  onBack,
  isSimulation,
}: {
  tp: TradePair
  onRetry?: TxStatusProps['onRetry']
  onBack?: () => void
  isSimulation?: boolean
}) {
  const safeRef = useSafe()
  const [typestep, setTypeStep] = useState<Pick<TxStatusProps, 'type' | 'step'>>({ type: 'loading' })
  const [open, setOpen] = useState(false)
  const setTxsOpen = useCallback(
    (open: boolean) => {
      setOpen(open)
      safeRef.current = open
      !open && setTypeStep({ type: 'loading' })
    },
    [safeRef],
  )

  const txsProps: TxStatusProps = useMemo(() => {
    return {
      type: typestep.type,
      step: typestep.step,
      tp: tp,
      onClose: (back) => {
        back && onBack && onBack()
        setTxsOpen(false)
      },
      onRetry,
    }
  }, [typestep, setTxsOpen, onRetry, onBack, tp])

  const intevalCheckStatus = async (reqId: string, minmax: [string, string] | { min: string; max: string }[]) => {
    const minmaxs: { min: string; max: string }[] = typeof minmax[0] == 'string' ? [{ min: minmax[0], max: minmax[1] }] : (minmax as any)
    setTypeStep({ type: 'step', step: minmaxs.map((item) => ({ ...item, step: 0 })) })
    while (true) {
      await sleep(5000)
      const r2 = await apiGet<TxTaskStatus>(isSimulation ? `/mock/task/${reqId}/detail` : `/common/order/task/${reqId}/detail`).catch(
        () => null,
      )
      if (r2?.task_status && r2?.task_status >= PREPARE_SEND_SUCCESS && r2?.task_status < MATCH_SUCCESS) {
        safeRef.current &&
          setTypeStep({
            type: 'step',
            step: minmaxs.map((item, index) => ({ ...item, step: 1, count: r2.order_probability_detail?.[index]?.itemSize || '1' })),
          })
      }
      if (r2?.task_status === MATCH_SUCCESS && r2?.order_probability_detail && r2?.order_probability_detail.length > 0) {
        safeRef.current &&
          setTypeStep({
            type: 'step',
            step: minmaxs.map((item, index) => ({
              ...item,
              step: 2,
              txHash: r2?.match_tx_hash,
              count: r2.order_probability_detail?.[index]?.itemSize || '1',
              price: displayBn(parseBn((r2.order_probability_detail?.[index]?.price || 0).toFixed(4))),
            })),
          })
        return true
      }
      if ((r2?.task_status || 0) < 0) {
        safeRef.current && setTypeStep({ type: 'fail' })
        return false
      }
      console.info('safe:', safeRef.current)
      if (!safeRef.current) {
        return false
      }
    }
  }
  return {
    txsProps,
    txsOpen: open,
    setTxsOpen,
    setTypeStep,
    intevalCheckStatus,
  }
}

const privilegePriceRange = [
  [0, 10],
  [10, 20],
  [90, 110],
  [990, 1010],
]

export function getPriceType(price: string | number): ValueType | undefined {
  const nump = Number(price)
  for (let index = 0; index < privilegePriceRange.length; index++) {
    const [_, max] = privilegePriceRange[index]
    if (nump <= max) return ValueTypes[index]
  }
  return ValueTypes[privilegePriceRange.length - 1]
}
