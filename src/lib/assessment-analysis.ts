import { BADMINTON_TESTS } from "./badminton-tests";

export type AnalysisResult = {
  analysis: string;
  recommendation: string;
};

const analyzeU9KeepUppy = (score: number): AnalysisResult => {
  if (score >= 25) {
    return {
      analysis: `Отличен резултат (${score} бр.)! Състезателят показва отличен контрол върху перото и ракетата. Координацията око-ръка е на много високо ниво.`,
      recommendation:
        "Може да преминете към по-трудни варианти - жонглиране с редуване на форхенд и бекхенд, или жонглиране в движение.",
    };
  } else if (score >= 15) {
    return {
      analysis: `Добър резултат (${score} бр.). Състезателят има добър усет, но се забелязват моменти на загуба на контрол.`,
      recommendation:
        "Фокусирайте състезателя върху запазване на ракетата успоредна на пода и следете да не изпуска перото от поглед до самия контакт. Възложете упражнения с балон за по-лесно проследяване.",
    };
  }
  return {
    analysis: `Резултатът (${score} бр.) показва нужда от подобряване на базовата координация око-ръка и усета за ракетата.`,
    recommendation:
      "Започнете с по-прости упражнения - балансиране на перо върху ракетата, жонглиране с балон или хващане на перо с ръка. Обърнете специално внимание на правилния форхенд хват.",
  };
};

const analyzeU9Catch = (score: number): AnalysisResult => {
  if (score >= 8) {
    return {
      analysis: `Отлична реакция и бързина (${score} т.). Състезателят успешно преценява траекторията на перото.`,
      recommendation:
        "Продължете с упражнения за бързина, като добавите ракета - посрещане на перото близо до мрежата.",
    };
  } else if (score >= 5) {
    return {
      analysis: `Средно ниво на бързина и реакция (${score} т.). Има нужда от по-бърз старт.`,
      recommendation:
        "Наблегнете на изискването за split-step (отскок) преди стартиране към перото. Включете тренировки за стартова бързина с конуси.",
    };
  }
  return {
    analysis: `Затруднения в преценката на полета на перото и реакцията (${score} т.).`,
    recommendation:
      "Дайте на състезателя да упражнява хвърляне и хващане на по-големи топки (напр. тенис топка), преди да се върнете на перо, за изграждане на увереност в проследяването.",
  };
};

const analyzeU9AgilityRun = (score: number): AnalysisResult => {
  if (score <= 12) {
    return {
      analysis: `Много добра ловкост и бързина (${score} сек.). Състезателят сменя посоките ефективно.`,
      recommendation:
        "Може да добавите специфични бадминтон стъпки към бягането (шасе, кръстосана стъпка) за повишаване на трудността.",
    };
  } else if (score <= 16) {
    return {
      analysis: `Добро темпо, но може да се подобри скоростта при смяна на посоките (${score} сек.).`,
      recommendation:
        "Изисквайте от състезателя по-нисък център на тежестта при спиране и обръщане. Включете упражнения със стълбичка за бързина.",
    };
  }
  return {
    analysis: `Резултатът (${score} сек.) индикира нужда от повече упражнения за пъргавина и координация на краката.`,
    recommendation:
      "Използвайте игри с гонене, щафетни игри с чести смени на посоката и базови упражнения за координация без ракета.",
  };
};

const analyzeU11BackhandServe = (score: number): AnalysisResult => {
  if (score >= 15) {
    return {
      analysis: `Отличен бекхенд сервис (${score} т.). Перото преминава ниско над мрежата и пада точно в целта.`,
      recommendation:
        "Може да започнете тренировки за скриване на сервиса (flick serve) и промяна на темпото.",
    };
  } else if (score >= 8) {
    return {
      analysis: `Приемлив сервис (${score} т.), но липсва постоянство в точността или височината.`,
      recommendation:
        "Насочете вниманието на състезателя към късото движение на палеца и стабилността на китката. Давайте серии от по 20 сервиса в мишена.",
    };
  }
  return {
    analysis: `Слаба успеваемост (${score} т.). Вероятно има грешка в хвата или позицията на тялото.`,
    recommendation:
      "Коригирайте бекхенд хвата (палецът да е на широката част на дръжката). Задайте упражнения пред огледало за усвояване на правилната биомеханика.",
  };
};

const analyzeU13HighClear = (score: number): AnalysisResult => {
  if (score >= 16) {
    return {
      analysis: `Много силен и дълбок клиър (${score} т.). Техниката над глава и трансферът на тежестта са отлични.`,
      recommendation:
        "Преминете към тренировки за атакуващ клиър (по-плосък) и добавете измамни движения (deceptive shots) от същата позиция.",
    };
  } else if (score >= 10) {
    return {
      analysis: `Добра дължина, но може би липсва височина или постоянство (${score} т.).`,
      recommendation:
        "Наблегнете върху ротацията на таза и раменете. Следете контактът с перото да е в най-високата възможна точка.",
    };
  }
  return {
    analysis: `Затруднения в изчистването на перото до задната линия (${score} т.).`,
    recommendation:
      "Включете упражнения за сила на раменния пояс (хвърляне на медицинска топка). Тренирайте правилното 'ножично' движение на краката за добавяне на мощност.",
  };
};

const analyzeGenericScore = (
  score: number,
  maxScore: number | undefined,
  scoreUnit: string | undefined
): AnalysisResult => {
  if (!maxScore) {
    return {
      analysis: `Регистриран резултат: ${score} ${scoreUnit || ""}.`,
      recommendation:
        "Въз основа на този резултат, определете индивидуална програма за подобряване на показателите на състезателя.",
    };
  }

  const percentage = (score / maxScore) * 100;

  if (percentage >= 85) {
    return {
      analysis: `Отличен резултат (${score} от ${maxScore} ${scoreUnit || ""}). Състезателят показва майсторство в това упражнение.`,
      recommendation:
        "Продължете да надграждате. Преминете към по-сложни вариации на упражнението за състезателя в състезателна обстановка.",
    };
  } else if (percentage >= 60) {
    return {
      analysis: `Много добър резултат (${score} от ${maxScore} ${scoreUnit || ""}). Има стабилна основа, но и поле за надграждане.`,
      recommendation:
        "Фокусирайте състезателя върху детайлите и постоянството. Увеличете повторенията в тренировките му.",
    };
  } else if (percentage >= 40) {
    return {
      analysis: `Среден резултат (${score} от ${maxScore} ${scoreUnit || ""}). Техниката се нуждае от допълнително затвърждаване.`,
      recommendation:
        "Изолирайте отделните фази на движението за състезателя. Възложете му повече повторения без напрежение или времево ограничение.",
    };
  }
  return {
    analysis: `Слаб резултат (${score} от ${maxScore} ${scoreUnit || ""}). Налице са затруднения с основното изпълнение.`,
    recommendation:
      "Разбийте упражнението на по-малки и лесни стъпки за състезателя. Върнете се към коригиране на базовата му техника.",
  };
};

export const generateAssessmentAnalysis = (
  testId: string,
  score: number,
  _scoreType: "number" | "time" | "percentage" | "text"
): AnalysisResult => {
  const test = BADMINTON_TESTS.find((t) => t.id === testId);
  if (!test) {
    return {
      analysis: "Липсва информация за този тест.",
      recommendation: "Моля, консултирайте се с треньор за повече информация.",
    };
  }

  if (testId === "u9_keep_uppy") return analyzeU9KeepUppy(score);
  if (testId === "u9_catch") return analyzeU9Catch(score);
  if (testId === "u9_agility_run") return analyzeU9AgilityRun(score);
  if (testId === "u11_backhand_serve") return analyzeU11BackhandServe(score);
  if (testId === "u13_high_clear") return analyzeU13HighClear(score);

  return analyzeGenericScore(score, test.maxScore, test.scoreUnit);
};
